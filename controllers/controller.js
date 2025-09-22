import Quiz from "../models/quizSchema.js";
import MCQQuestion from "../models/questionTypes/mcqQuestion.js";
import MSQQuestion from "../models/questionTypes/msqQuestion.js";
import TextQuestion from "../models/questionTypes/textQuestion.js";
// QUIZ CRUD OPERATIONS

/** Create a new quiz */
export async function createQuiz(req, res) {
    try {
        const { title, description } = req.body;
        const quiz = new Quiz({ title, description, questions: [] });
        await quiz.save();
        res.status(201).json(quiz);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/** Get all quizzes */
export async function getAllQuizzes(req, res) {
    try {
        const quizzes = await Quiz.find().populate('questions');
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/** Get a single quiz by ID */
export async function getQuizById(req, res) {
    try {
        const quiz = await Quiz.findById(req.params.quizid).populate('questions');
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        res.json(quiz);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/** Update a quiz by ID */
export async function updateQuiz(req, res) {
    try {
        const { title, description } = req.body;
        const quiz = await Quiz.findByIdAndUpdate(
            req.params.quizid,
            { title, description },
            { new: true }
        );
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        res.json(quiz);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/** Delete a quiz by ID */
export async function deleteQuiz(req, res) {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.quizid);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        // Optionally, delete all questions associated with this quiz
        await Question.deleteMany({ _id: { $in: quiz.questions } });
        res.json({ msg: 'Quiz and its questions deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// QUESTION CRUD OPERATIONS (for individual questions)

/** Add a question to a quiz (MCQ, MSQ, or Text) */
export async function createQuestion(req, res) {
    try {
        const { type, text, options, correctAnswer, correctAnswers, explanation } = req.body;
        const quiz = await Quiz.findById(req.params.quizid);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        let question, modelName;
        if (type === 'mcq') {
            question = new MCQQuestion({ text, options, correctAnswer, explanation });
            modelName = 'MCQQuestion';
        } else if (type === 'msq') {
            question = new MSQQuestion({ text, options, correctAnswers, explanation });
            modelName = 'MSQQuestion';
        } else if (type === 'text') {
            question = new TextQuestion({ text, correctAnswer, explanation });
            modelName = 'TextQuestion';
        } else {
            return res.status(400).json({ error: 'Invalid question type' });
        }
        await question.save();
        quiz.questions.push({ question: question._id, questionModel: modelName });
        await quiz.save();
        res.status(201).json(question);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/** Get a question by ID (within a quiz) */
export async function getQuestionById(req, res) {
    try {
        const quiz = await Quiz.findById(req.params.quizid);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        const qref = quiz.questions.find(q => q.question.equals(req.params.qid));
        if (!qref) return res.status(404).json({ error: 'Question not in this quiz' });
        let Model;
        if (qref.questionModel === 'MCQQuestion') Model = MCQQuestion;
        else if (qref.questionModel === 'MSQQuestion') Model = MSQQuestion;
        else if (qref.questionModel === 'TextQuestion') Model = TextQuestion;
        else return res.status(400).json({ error: 'Unknown question type' });
        const question = await Model.findById(qref.question);
        if (!question) return res.status(404).json({ error: 'Question not found' });
        res.json(question);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/** Update a question by ID (within a quiz) */
export async function updateQuestion(req, res) {
    try {
        const quiz = await Quiz.findById(req.params.quizid);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        const qref = quiz.questions.find(q => q.question.equals(req.params.qid));
        if (!qref) return res.status(404).json({ error: 'Question not in this quiz' });
        let Model, updateData;
        if (qref.questionModel === 'MCQQuestion') {
            Model = MCQQuestion;
            const { text, options, correctAnswer, explanation } = req.body;
            updateData = { text, options, correctAnswer, explanation };
        } else if (qref.questionModel === 'MSQQuestion') {
            Model = MSQQuestion;
            const { text, options, correctAnswers, explanation } = req.body;
            updateData = { text, options, correctAnswers, explanation };
        } else if (qref.questionModel === 'TextQuestion') {
            Model = TextQuestion;
            const { text, correctAnswer, explanation } = req.body;
            updateData = { text, correctAnswer, explanation };
        } else {
            return res.status(400).json({ error: 'Unknown question type' });
        }
        const question = await Model.findByIdAndUpdate(
            req.params.qid,
            updateData,
            { new: true }
        );
        if (!question) return res.status(404).json({ error: 'Question not found' });
        res.json(question);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/** Delete a question by ID (within a quiz) */
export async function deleteQuestion(req, res) {
    try {
        const quiz = await Quiz.findById(req.params.quizid);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        const qref = quiz.questions.find(q => q.question.equals(req.params.qid));
        if (!qref) return res.status(404).json({ error: 'Question not in this quiz' });
        let Model;
        if (qref.questionModel === 'MCQQuestion') Model = MCQQuestion;
        else if (qref.questionModel === 'MSQQuestion') Model = MSQQuestion;
        else if (qref.questionModel === 'TextQuestion') Model = TextQuestion;
        else return res.status(400).json({ error: 'Unknown question type' });
        const question = await Model.findByIdAndDelete(qref.question);
        if (!question) return res.status(404).json({ error: 'Question not found' });
        quiz.questions = quiz.questions.filter(q => !q.question.equals(req.params.qid));
        await quiz.save();
        res.json({ msg: 'Question deleted from quiz' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/** Get all questions for a quiz (with type info) */
export async function getQuestions(req, res) {
    try {
        const quiz = await Quiz.findById(req.params.quizid);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        // Fetch all questions by type
        const questions = await Promise.all(quiz.questions.map(async qref => {
            let Model;
            if (qref.questionModel === 'MCQQuestion') Model = MCQQuestion;
            else if (qref.questionModel === 'MSQQuestion') Model = MSQQuestion;
            else if (qref.questionModel === 'TextQuestion') Model = TextQuestion;
            else return null;
            const question = await Model.findById(qref.question);
            if (!question) return null;
            return { ...question.toObject(), questionModel: qref.questionModel, _id: qref.question };
        }));
        res.json(questions.filter(q => q));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Remove insertQuestions (not needed in RESTful design)

/** Delete all questions from a quiz */
export async function dropQuestions(req, res) {
    try {
        const quiz = await Quiz.findById(req.params.quizid);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        // Delete all questions by type
        for (const qref of quiz.questions) {
            let Model;
            if (qref.questionModel === 'MCQQuestion') Model = MCQQuestion;
            else if (qref.questionModel === 'MSQQuestion') Model = MSQQuestion;
            else if (qref.questionModel === 'TextQuestion') Model = TextQuestion;
            else continue;
            await Model.findByIdAndDelete(qref.question);
        }
        quiz.questions = [];
        await quiz.save();
        res.json({ msg: 'All questions deleted from quiz' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}