import User from "../models/user.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

export async function createUser(req , res){  

    try{

        const passwordHash = bcrypt.hashSync(req.body.password, 10)


        const newUser = new User({
            email : req.body.email,
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            password : passwordHash
        })

        await newUser.save()

        res.json({
            message : "User Created Successfully"
        })
    }catch(error){
        res.json(
            {
                message : "Error creating user"
            }
        )
    }
}

export async function loginUser(req,res){

    try{
        
       const user = await User.findOne({
            email : req.body.email
       })
       console.log(user)

       if(user == null){
            res.status(404).json({
                message : "User not found"
            })
       }else{
            const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.password)

            if(isPasswordCorrect){                
                const payload = {
                    email : user.email,
                    firstName : user.firstName,
                    lastName : user.lastName,
                    isAdmin : user.isAdmin,
                    isBlocked : user.isBlocked,
                    isEmailVerified : user.isEmailVerified,
                    image : user.image
                }

                const token = jwt.sign(payload, process.env.JWT_SECRET , {
                    expiresIn : "48h"
                })

                res.json({
                    token : token,
                    isAdmin : user.isAdmin,
                })


            }else{
                res.status(401).json({
                    message : "Invalid Password"
                })
            }
       }        
    }catch(error){
        res.status(500).json(
            {
                message : "Error logging in"
            }
        )
    }

}


export async function getUserData(req,res){

    if(req.user == null){
        res.status(401).json({
            message : "Unauthorized"
        })
    }else{
        res.json(req.user)
    }
}

export async function updateUserData(req,res){
    if(req.user == null){
        res.status(401).json({
            message : "Unauthorized"
        })
    }else{

        try{

            await User.findOneAndUpdate(
                { email : req.user.email },
                { firstName : req.body.firstName, lastName : req.body.lastName , image : req.body.image }
            )

            // Users existing token contains old information. But in here we have updated the user data. So we will generate a new token with updated information and send it to the user.
            

            const updatedUser = await User.findOne({ email : req.user.email })

            console.log(updatedUser)

            const token = jwt.sign(
                {
                    email : updatedUser.email,
                    firstName : updatedUser.firstName,
                    lastName : updatedUser.lastName,
                    isAdmin : updatedUser.isAdmin,
                    isBlocked : updatedUser.isBlocked,
                    isEmailVerified : updatedUser.isEmailVerified,
                    image : updatedUser.image
                },
                process.env.JWT_SECRET,
                { expiresIn : "48h" }
            )

            res.json({
                message : "User data updated successfully",
                token : token
            })

        }catch(error){
            res.status(500).json({
                message : "Error updating user data"
            })
        }


    }
}

export async function changePassword(req,res){

    if(req.user == null){
        res.status(401).json({
            message : "Unauthorized"
        })
    }

    try{

        const hashedPassword = bcrypt.hashSync(req.body.newPassword, 10)
        await User.findOneAndUpdate(
            { email : req.user.email },
            { password : hashedPassword }
        )
        res.json({
            message : "Password changed successfully"
        })
    }catch(error){
        res.status(500).json({
            message : "Error changing password"
        })
    }
}

export function isAdmin(req){
    if(req.user == null){
        return false
    }
    if(req.user.isAdmin){
        return true
    }else{
        return false
    }
}


/* =========================================================
   ADMIN-ONLY FUNCTIONS
========================================================= */

/* ================= GET ALL USERS (ADMIN) ================= */
export async function getAllUsers(req, res) {
    if (req.user == null) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    try {
        // Confirm admin via DB (safest source of truth)
        const currentUser = await User.findOne({ email: req.user.email })
        if (currentUser == null || !currentUser.isAdmin) {
            return res.status(403).json({
                message: "Admin access required"
            })
        }

        // Fetch all users, exclude password, newest first
        const users = await User.find()
            .select("-password")
            .sort({ _id: -1 })

        res.json(users)
    } catch (error) {
        res.status(500).json({
            message: "Error fetching users"
        })
    }
}

/* ================= TOGGLE BLOCK (ADMIN) ================= */
export async function toggleBlockUser(req, res) {
    if (req.user == null) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    try {
        const currentUser = await User.findOne({ email: req.user.email })
        if (currentUser == null || !currentUser.isAdmin) {
            return res.status(403).json({
                message: "Admin access required"
            })
        }

        const targetUser = await User.findById(req.params.id)
        if (targetUser == null) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        // Prevent admin from blocking themselves
        if (targetUser.email === req.user.email) {
            return res.status(400).json({
                message: "You cannot block your own account"
            })
        }

        targetUser.isBlocked = !!req.body.isBlocked
        await targetUser.save()

        const safeUser = await User.findById(targetUser._id).select("-password")

        res.json({
            message: "User block status updated",
            user: safeUser
        })
    } catch (error) {
        res.status(500).json({
            message: "Error updating user block status"
        })
    }
}

/* ================= TOGGLE ADMIN (ADMIN) ================= */
export async function toggleAdminUser(req, res) {
    if (req.user == null) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    try {
        const currentUser = await User.findOne({ email: req.user.email })
        if (currentUser == null || !currentUser.isAdmin) {
            return res.status(403).json({
                message: "Admin access required"
            })
        }

        const targetUser = await User.findById(req.params.id)
        if (targetUser == null) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        // Prevent admin from demoting themselves
        if (targetUser.email === req.user.email) {
            return res.status(400).json({
                message: "You cannot change your own admin role"
            })
        }

        targetUser.isAdmin = !!req.body.isAdmin
        await targetUser.save()

        const safeUser = await User.findById(targetUser._id).select("-password")

        res.json({
            message: "User admin role updated",
            user: safeUser
        })
    } catch (error) {
        res.status(500).json({
            message: "Error updating user admin role"
        })
    }
}