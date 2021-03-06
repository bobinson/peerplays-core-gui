import AccountRepository from '../repositories/AccountRepository';
import CONFIG from '../config/main';

const faucet = CONFIG.FAUCET_URL;

class AccountService {
  /**
   * Select free name
   *
   * @param {string} accountName
   * @param {number} attempts
   */
  static getFreeAccountName(accountName, attempts = 0) {
    let nextAccountName = accountName;

    if (attempts > 0) {
      nextAccountName += ('-' + attempts);
    }

    return AccountRepository.fetchFullAccount(nextAccountName).then((account) => {
      if (!account) {
        return nextAccountName;
      }

      return AccountService.getFreeAccountName(accountName, ++attempts);
    });
  }

  /**
   * Get faucet address
   *
   * @param attempt
   * @param accountName
   * @param ownerPrivate
   * @param activePrivate
   * @param memoPrivate
   * @param referral
   * @returns {Promise}
   */
  static fetchFaucetAddress(
    attempt,
    accountName,
    ownerPrivate,
    activePrivate,
    memoPrivate,
    referral
  ) {
    return new Promise((resolve, reject) => {
      let faucetAddress = faucet;

      if (window && window.location && window.location.protocol === 'https:') {
        faucetAddress = faucetAddress.replace(/http:\/\//, 'https://');
      }

      return fetch(faucetAddress, {
        method: 'post',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          'account': {
            'name': accountName,
            'owner_key': ownerPrivate.toPublicKey().toPublicKeyString(),
            'active_key': activePrivate.toPublicKey().toPublicKeyString(),
            'memo_key': memoPrivate.toPublicKey().toPublicKeyString(),
            'refcode': referral,
            // web assets index.html declares this.
            'referrer': window && window.BTSW ? BTSW.referrer : '' // eslint-disable-line
          }
        })
      }).then((response) => {
        let res = response.json();
        resolve(res);
      }).catch((err) => {
        if (attempt > 2) {
          reject(err);
        } else {
          attempt++;
          return AccountService.fetchFaucetAddress(
            attempt,
            accountName,
            ownerPrivate,
            activePrivate,
            referral
          ).then((res) => resolve(res)).catch((err) => reject(err));
        }
      });
    });
  }
}

export default AccountService;