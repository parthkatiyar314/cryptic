import { checkAuth } from "../middlewares/auth.js";
import User from "../models/user.js";
import Team from "../models/team.js";
import questions from "../db/questions.js";
import dares from "../db/dares.js";
import express from 'express'
import { z } from 'zod'
import eventActive from "../middlewares/cryptic.js";
const router = express.Router();
const startTime = new Date("Aug 7, 2024 14:00:00")

const answerSchema = z.object({
    answer: z.string().min(1, { message: "Please enter the answer" })
});

router.get('/cryptic', checkAuth, eventActive, async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    try {
        const user = await User.findById(req.user._id);
        const team = await Team.findById(user.teamId);

        if (team.questionData.current > 10) {
            return res.render('stats');
        }
        const question = questions[team.questionData.current];

        if (team.isBlocked) {
            let dare = null;
            let dareNo = null;
            if (!team.questionData.currentDare) {
                if (team.questionData.daresCompleted.length == dares.length) {
                    dare = "Ask the organisers for the dare";
                    team.questionData.currentDare = 404; //If the team has completed all the available dares
                }
                else {
                    while (true) {
                        const dareNo = Math.floor(Math.random() * dares.length) + 1;
                        if (!team.questionData.daresCompleted.includes(dareNo))
                            dare = dares[dareNo - 1]; 
                        team.questionData.currentDare = dareNo;
                        break;
                    }
                }
            }
            else {
                dareNo = team.questionData.currentDare;
                dare = dares[dareNo - 1];
            }
            await team.save();
            return res.render('cryptic', { question, isBlocked: true, dare, dareNo });
        }
        return res.render('cryptic', { question, isBlocked: false, dare: null, dareNo: null });
    } catch (err) {
        console.error('Error fetching user or team data:', err);
        return res.status(500).send('Internal Server Error');
    }

});

router.post('/cryptic', checkAuth, eventActive, async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    try {
        let { answer } = answerSchema.parse(req.body);
        answer = answer.trim();
        const user = await User.findById(req.user._id);
        const team = await Team.findById(user.teamId);
        if (team.questionData.current > 10) {
            return res.redirect('/cryptic');
        }
        if (team.isBlocked) {
            return res.redirect('/cryptic')
        }
        user.noOfAttempts += 1;
        const current = team.questionData.current;
        if (team.questionData.questions[current]) {
            team.questionData.questions[current].allAnswers.push(answer);
            team.questionData.questions[current].attempts += 1;
            if (questions[current].a.toLowerCase() == answer.toLowerCase()) {
                team.questionData.questions[current].answered = true;
                team.questionData.questions[current].answeredBy = user._id;
                team.questionData.questions[current].submitTime = new Date(new Date().getTime() + (5 * 60 + 30) * 60 * 1000);
                team.questionData.wrongAttempts = 0;
                team.questionData.score += questions[current].score;
                user.noOfQuestionsAnswered += 1
                if (current == 0) {
                    team.questionData.questions[0].timeTaken = team.questionData.questions[0].submitTime - startTime;
                }
                else {
                    team.questionData.questions[current].timeTaken = team.questionData.questions[current].submitTime - team.questionData.questions[current - 1].submitTime;
                }
                team.questionData.current += 1;
            }
            else {
                team.questionData.wrongAttempts += 1;
                if (team.questionData.wrongAttempts >= 3) {
                    team.isBlocked = true;
                }
            }
        }
        else {
            let answeredBy = null
            let answered = false;
            let submitTime = null;
            let timeTaken = 0;
            if (questions[current].a.toLowerCase() == answer.toLowerCase()) {
                user.noOfQuestionsAnswered += 1
                answeredBy = user._id;
                answered = true;
                submitTime = new Date(new Date().getTime() + (5 * 60 + 30) * 60 * 1000);
                team.questionData.wrongAttempts = 0;
                team.questionData.score += questions[current].score;
                if (current == 0) {
                    timeTaken = submitTime - startTime;
                }
                else {
                    timeTaken = submitTime - team.questionData.questions[current - 1].submitTime;
                }
                team.questionData.current += 1;
            }
            else {
                team.questionData.wrongAttempts += 1;
                if (team.questionData.wrongAttempts >= 3) {
                    team.isBlocked = true;
                }
            }
            let newQuestion = {
                answered,
                timeTaken,
                answeredBy,
                attempts: 1,
                submitTime,
                allAnswers: []
            };
            newQuestion.allAnswers.push(answer);
            team.questionData.questions.push(newQuestion);
        }
        await user.save();
        await team.save();
        return res.redirect('/cryptic')
    } catch (error) {
        console.log(error)
        return res.render('cryptic', { error: error.errors[0].message });
    }
});

// router.get('/start', (req, res) => {
//     console.log("Event started")
//     startTime = new Date();
//     res.redirect('/phoenix')
// });

export default router;