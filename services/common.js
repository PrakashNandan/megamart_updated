const passport = require('passport');

exports.isAuth = (req, res, done) => {
  return passport.authenticate('jwt')
};

exports.sanitizeUser = (user)=>{
    return {id:user.id, role:user.role}
}


exports.cookieExtractor = function (req) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['jwt'];
  }
  //TODO : this is temporary token for testing without cookie
 //admin // token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1M2Q1ZmNjNGZhOTlmN2FmMGUyYTQ1YiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjk4NTIxMDM2fQ.94yY0R3XSnzq_eaIkqteWOesFs12uSujZ7unZkCcWV4"
  // token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1M2JlNmZjMzI4ZGZiOGNjN2I5NzU5NyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjk4NTU4NTc5fQ.N4rc6yEifbVSY4hW4-jxk_1jyJuq7VvTuBmicTLEefI"
    // token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YzdhMDQzZGUzNGYyYmIzZWYzNzMwZiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzI1NjI4NDY5fQ.uzaI1AwbTlE2Obo0vkpwUyTMrJeMpXiAMBDU_LAnTdo"
    // token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1M2Q1ZmNjNGZhOTlmN2FmMGUyYTQ1YiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcyNTgwMjgyOH0.m15UqNclLyzw_tQC217IYfxKmxZeK0Yph3lg6DFB4vE"
    return token;
};