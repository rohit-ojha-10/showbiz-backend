function authenticate(req,res,next)
{
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if(token == null)return res.json({success:false,message:"Invalid Token"})
        jwt.verify(token , process.env.ACCESS_WEB_TOKEN,(err,payload)=>{
            if(err)return res.json({success:false,message:err})
            req.body.success = true;
            req.payload=username;    
            next()
        })
    } catch (error) {
        return res.json({success : false,message:"Invalid token"})
    }  

}
module.exports = {
    authenticate
}