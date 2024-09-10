const { Category } = require('../model/Category');
const {User}= require('../model/User')

exports.fetchUserById= async (req, res) => {
    const {id} = req.user;  // or const {id} = req.params
    console.log(id);
  try {
    const user = await User.findById(id)
    
    res.status(200).json({id:user.id, email:user.email, role:user.role, addresses:user.addresses});
  } catch (err) {
    res.status(400).json(err);
  }
};


exports.updateUser = async (req, res) => {

    const {id} = req.params;
     try {
         const user = await User.findByIdAndUpdate(id, req.body, {new:true});
         res.status(201).json(user);
       } catch (err) {
         res.status(400).json(err);
       }
}