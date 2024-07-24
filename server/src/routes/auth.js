import express from 'express';
import Team from '../models/team.js';
import User from '../models/user.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
import { setUser } from '../utils/jwtfuncs.js';
import { checkAuth } from '../middlewares/auth.js';
import regActive from '../middlewares/registrations.js';
dotenv.config();
const router = express.Router();

const registerSchema = z.object({
    teamName: z.string()
        .min(1, { message: "Please enter the team name" })
        .refine(value => /^[a-zA-Z0-9@\-_\(\). ]+$/.test(value), {
            message: "Only @ , - , _ , ( , ) , . are allowed as special characters"
        }),
    username: z.string()
        .min(2, { message: "Username should be at least 2 characters long" })
        .refine(value => /^[a-zA-Z0-9@\-_\(\). ]+$/.test(value), {
            message: "Only @ , - , _ , ( , ) , . are allowed as special characters"
        }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(6, { message: "Password should be atleast 6 characters long" }),
});

const loginSchema = z.object({
    username: z.string().min(2, { message: "Username is atleast 2 characters long" }),
    password: z.string().min(6, { message: "Password is atleast 6 characters long" }),
});

router.get('/register', regActive, (req, res) => {
    return res.render('register', { error: null });
});

router.get('/login', (req, res) => {
    return res.render('login', { error: null });
});

router.post('/register', regActive, async (req, res) => {
    try {
        const { teamName, username, password } = registerSchema.parse(req.body);
        let email = req.body.email.toLowerCase()
        const teamExists = await Team.findOne({
            teamName: {
                $regex: new RegExp('^' + teamName.toLowerCase().replace(/[.*+?^${}()|[\]\\%&-]/g, '\\$&') + '$', 'i')
            }
        });
        const usernameExists = await User.findOne({
            username: {
                $regex: new RegExp('^' + username.toLowerCase().replace(/[.*+?^${}()|[\]\\%&-]/g, '\\$&') + '$', 'i')
            }
        });
        const emailExists = await User.findOne({ email });

        if (teamExists) {
            return res.render('register', { error: 'Team with this name already registered' });
        }
        if (usernameExists) {
            return res.render('register', { error: 'User with this username already registered' });
        }
        if (emailExists) {
            return res.render('register', { error: 'Email already registered' });
        }
        const hash = await bcrypt.hash(password, 12);
        const team = new Team({
            teamName
        });
        const newTeam = await team.save();
        const user = new User({
            teamId: newTeam._id,
            username,
            email,
            password: hash,
            isLeader: true,
        });
        let newUser = await user.save();
        team.members.push(newUser._id)
        await team.save();

        return res.redirect("/login");

    } catch (error) {
        if (error.errors && error.errors.length > 0) {
            console.log(error)
            return res.render('register', { error: error.errors[0].message });
        } else {
            console.log(error)
            return res.render('register', { error: "Bad Credentials" });
        }
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = loginSchema.parse(req.body);
        const user = await User.findOne({
            username: {
                $regex: new RegExp('^' + username.toLowerCase().replace(/[.*+?^${}()|[\]\\%&-]/g, '\\$&') + '$', 'i')
            }
        });
        if (!user) {
            return res.render('login', { error: 'Invalid username or password' });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.render('login', { error: 'Invalid username or password' });
        }
        const token = setUser({ _id: user._id, isLeader: user.isLeader });
        res.cookie('token', token, { httpOnly: true, secure: (process.env.NODE_ENV || 'dev') === 'prod' });
        user.currentToken = token;
        user.loggedIn = true;
        await user.save();
        // res.cookie('token', token, { httpOnly: true });

        return res.redirect('/cryptic');
    } catch (error) {
        if (error.errors && error.errors.length > 0) {
            return res.render('register', { error: error.errors[0].message });
        } else {
            console.log(error)
            return res.render('register', { error: "Bad Credentials" });
        }
    }
});

router.get('/logout', checkAuth, async (req, res) => {
    if (req.user) {
        const user = await User.findById(req.user._id);
        user.loggedIn = false;
        await user.save();
    }
    req.user = null;
    req.admin = null;
    req.superuser = null
    res.clearCookie('token');
    res.clearCookie('pelican');
    res.clearCookie('titan');
    return res.redirect('/login')
})

export default router;