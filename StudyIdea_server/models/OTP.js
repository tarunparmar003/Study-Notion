const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
// const emailTemplate = require("../mail/templates/emailVerificationTemplate");
const OTPSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
		},
		otp: {
			type: String,
			required: true,
		},
		createdAt: {
			type: Date,
			default: Date.now,
			expires: 60 * 5, // The document will be automatically deleted after 5 minutes of its creation time
		},
	}
)
//function for sending mail
async function sendVerificationEmail(email,otp){
	try{
		const mailResponse=await mailSender(email,"Verification email from StudyIdea",otp);
		console.log("email send seccessfully: ",mailResponse);
	}
	catch(error){
		console.log("Error occure while sending mail : ", error);
		throw error;
	}
};

OTPSchema.pre("save",async function(next){
	await sendVerificationEmail(this.email,this.otp)
	next();
});
module.exports = mongoose.model("OTP",OTPSchema);