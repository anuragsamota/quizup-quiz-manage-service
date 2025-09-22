//models/quizSchema.js

import mongoose from "mongoose";
const { Schema } = mongoose;

/** quiz model */
const quizModel = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    questions: [{
        question: { type: Schema.Types.ObjectId, required: true, refPath: 'questions.questionModel' },
        questionModel: { type: String, required: true, enum: ['MCQQuestion', 'MSQQuestion', 'TextQuestion'] }
    }],
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Quiz', quizModel);
