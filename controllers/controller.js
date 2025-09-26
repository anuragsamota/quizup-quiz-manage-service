import Quiz from "../models/quizSchema.js";
import MCQQuestion from "../models/questionTypes/mcqQuestion.js";
import MSQQuestion from "../models/questionTypes/msqQuestion.js";
import TextQuestion from "../models/questionTypes/textQuestion.js";
// QUIZ CRUD OPERATIONS

/** Create a new quiz */
export async function createQuiz(req, res) {
    try {
        const { title, description, organizer } = req.body;
        
        // Validate organizer data
        if (!organizer || !organizer.username) {
            return res.status(400).json({ 
                error: 'Organizer username is required' 
            });
        }
        
        const quiz = new Quiz({ 
            title, 
            description, 
            organizer: {
                username: organizer.username
            },
            questions: [] 
        });
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

/** Get all quizzes by organizer username */
export async function getQuizzesByOrganizer(req, res) {
    try {
        const { username } = req.params;
        const quizzes = await Quiz.find({ 'organizer.username': username }).populate('questions');
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
        const { title, description, organizer } = req.body;
        const updateData = {};
        
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (organizer !== undefined && organizer.username !== undefined) {
            updateData['organizer.username'] = organizer.username;
        }
        
        const quiz = await Quiz.findByIdAndUpdate(
            req.params.quizid,
            updateData,
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
        
        // Delete all questions associated with this quiz
        for (const qref of quiz.questions) {
            let Model;
            if (qref.questionModel === 'MCQQuestion') Model = MCQQuestion;
            else if (qref.questionModel === 'MSQQuestion') Model = MSQQuestion;
            else if (qref.questionModel === 'TextQuestion') Model = TextQuestion;
            else continue;
            await Model.findByIdAndDelete(qref.question);
        }
        
        res.json({ msg: 'Quiz and its questions deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// QUESTION CRUD OPERATIONS

// Helper function to get the appropriate model and validate question type
function getQuestionModel(type) {
    const models = {
        'mcq': { Model: MCQQuestion, name: 'MCQQuestion' },
        'msq': { Model: MSQQuestion, name: 'MSQQuestion' },
        'text': { Model: TextQuestion, name: 'TextQuestion' }
    };
    return models[type] || null;
}

// Helper function to find question reference in quiz
function findQuestionInQuiz(quiz, questionId) {
    return quiz.questions.find(q => q.question.toString() === questionId.toString());
}

// Helper function to get model by name
function getModelByName(modelName) {
    const modelMap = {
        'MCQQuestion': MCQQuestion,
        'MSQQuestion': MSQQuestion,
        'TextQuestion': TextQuestion
    };
    return modelMap[modelName] || null;
}

/** Create a new question and add it to a quiz */
export async function createQuestion(req, res) {
    try {
        const { type, text, options, correctAnswer, correctAnswers, explanation } = req.body;
        
        // Validate quiz exists
        const quiz = await Quiz.findById(req.params.quizid);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        
        // Get appropriate model for question type
        const modelInfo = getQuestionModel(type);
        if (!modelInfo) {
            return res.status(400).json({ error: 'Invalid question type. Must be mcq, msq, or text' });
        }
        
        // Create question based on type
        let questionData;
        if (type === 'mcq') {
            questionData = { text, options, correctAnswer, explanation };
        } else if (type === 'msq') {
            questionData = { text, options, correctAnswers, explanation };
        } else if (type === 'text') {
            questionData = { text, correctAnswer, explanation };
        }
        
        // Create and save question
        const question = new modelInfo.Model(questionData);
        await question.save();
        
        // Add question reference to quiz
        quiz.questions.push({ 
            question: question._id, 
            questionModel: modelInfo.name 
        });
        await quiz.save();
        
        res.status(201).json({
            message: 'Question created successfully',
            question: question
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/** Get all questions for a quiz */
export async function getQuestions(req, res) {
    try {
        const quiz = await Quiz.findById(req.params.quizid);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        
        // Fetch all questions with their details
        const questions = [];
        for (const qref of quiz.questions) {
            const Model = getModelByName(qref.questionModel);
            if (Model) {
                const question = await Model.findById(qref.question);
                if (question) {
                    questions.push({
                        _id: qref.question,
                        questionModel: qref.questionModel,
                        ...question.toObject()
                    });
                }
            }
        }
        
        res.json({
            message: 'Questions retrieved successfully',
            count: questions.length,
            questions: questions
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/** Get a specific question by ID */
export async function getQuestionById(req, res) {
    try {
        const quiz = await Quiz.findById(req.params.quizid);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        
        // Find question reference in quiz
        const qref = findQuestionInQuiz(quiz, req.params.qid);
        if (!qref) {
            return res.status(404).json({ error: 'Question not found in this quiz' });
        }
        
        // Get question from appropriate model
        const Model = getModelByName(qref.questionModel);
        if (!Model) {
            return res.status(400).json({ error: 'Invalid question model' });
        }
        
        const question = await Model.findById(qref.question);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        
        res.json({
            message: 'Question retrieved successfully',
            question: {
                _id: qref.question,
                questionModel: qref.questionModel,
                ...question.toObject()
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/** Update a question by ID */
export async function updateQuestion(req, res) {
    try {
        const quiz = await Quiz.findById(req.params.quizid);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        
        // Find question reference in quiz
        const qref = findQuestionInQuiz(quiz, req.params.qid);
        if (!qref) {
            return res.status(404).json({ error: 'Question not found in this quiz' });
        }
        
        // Get appropriate model and prepare update data
        const Model = getModelByName(qref.questionModel);
        if (!Model) {
            return res.status(400).json({ error: 'Invalid question model' });
        }
        
        // Filter out undefined values from request body
        const updateData = {};
        const allowedFields = ['text', 'options', 'correctAnswer', 'correctAnswers', 'explanation'];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });
        
        // Update question
        const updatedQuestion = await Model.findByIdAndUpdate(
            qref.question,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedQuestion) {
            return res.status(404).json({ error: 'Question not found' });
        }
        
        res.json({
            message: 'Question updated successfully',
            question: updatedQuestion
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

/** Delete a question by ID */
export async function deleteQuestion(req, res) {
    try {
        const quiz = await Quiz.findById(req.params.quizid);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        
        // Find question reference in quiz
        const qref = findQuestionInQuiz(quiz, req.params.qid);
        if (!qref) {
            return res.status(404).json({ error: 'Question not found in this quiz' });
        }
        
        // Get appropriate model
        const Model = getModelByName(qref.questionModel);
        if (!Model) {
            return res.status(400).json({ error: 'Invalid question model' });
        }
        
        // Delete question from model
        const deletedQuestion = await Model.findByIdAndDelete(qref.question);
        if (!deletedQuestion) {
            return res.status(404).json({ error: 'Question not found in database' });
        }
        
        // Remove question reference from quiz
        quiz.questions = quiz.questions.filter(
            q => q.question.toString() !== req.params.qid.toString()
        );
        await quiz.save();
        
        res.json({
            message: 'Question deleted successfully',
            deletedQuestion: deletedQuestion
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/** Delete all questions from a quiz */
export async function dropQuestions(req, res) {
    try {
        const quiz = await Quiz.findById(req.params.quizid);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        
        // Delete all questions from their respective models
        const deletedCount = quiz.questions.length;
        for (const qref of quiz.questions) {
            const Model = getModelByName(qref.questionModel);
            if (Model) {
                await Model.findByIdAndDelete(qref.question);
            }
        }
        
        // Clear questions array in quiz
        quiz.questions = [];
        await quiz.save();
        
        res.json({
            message: 'All questions deleted successfully',
            deletedCount: deletedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}