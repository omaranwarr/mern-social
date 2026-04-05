import express from 'express'
import authCtrl from '../controllers/auth.controller'
import profileCtrl from '../controllers/profile.controller'
import followCtrl from '../controllers/follow.controller'
import peopleCtrl from '../controllers/people.controller'

const router = express.Router()

router.route('/api/users')
  .get(profileCtrl.list)
  .post(authCtrl.signupRequest)

router.route('/api/users/verify-email')
  .post(authCtrl.verifyEmailAndSignup)

router.route('/api/users/photo/:userId')
  .get(profileCtrl.photo, profileCtrl.defaultPhoto)
router.route('/api/users/defaultphoto')
  .get(profileCtrl.defaultPhoto)

router.route('/api/users/follow')
    .put(authCtrl.requireSignin, followCtrl.addFollowing, followCtrl.addFollower)
router.route('/api/users/unfollow')
    .put(authCtrl.requireSignin, followCtrl.removeFollowing, followCtrl.removeFollower)

router.route('/api/users/findpeople/:userId')
   .get(authCtrl.requireSignin, peopleCtrl.findPeople)

router.route('/api/users/:userId')
  .get(authCtrl.requireSignin, profileCtrl.read)
  .put(authCtrl.requireSignin, authCtrl.hasAuthorization, profileCtrl.update)
  .delete(authCtrl.requireSignin, authCtrl.hasAuthorization, profileCtrl.remove)

router.param('userId', profileCtrl.userByID)

export default router
