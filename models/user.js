const mongoose = require('mongoose');
const bcrypt = require('bcrypt');



const userSchema = new mongoose.Schema({
    username :{
        type: String,
        requied: true
    },
    password :{
        type: String,
        requied: true
    },
    posts :{
        type: Array
    }
},{timestamps: true});

userSchema.pre('save', async function(next){
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);

    next();
})

userSchema.statics.login = async function(username, password) {
    const user = await this.findOne({ username });
    if(user){
        const auth = await bcrypt.compare(password , user.password);
        if(auth){
            return user;
        }
        throw Error('Incorrect Password');
    }
    throw Error('Incorrect Username');
}


const user = mongoose.model('user', userSchema);
module.exports = user;