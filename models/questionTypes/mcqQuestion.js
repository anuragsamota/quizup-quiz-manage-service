import mongoose from "mongoose";
const { Schema } = mongoose;

const mcqQuestionSchema = new Schema({
  type: { type: String, default: "mcq" },
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true }, // single answer
  explanation: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("MCQQuestion", mcqQuestionSchema);
