import mongoose from "mongoose";
const { Schema } = mongoose;

const msqQuestionSchema = new Schema({
  type: { type: String, default: "msq" },
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswers: [{ type: String, required: true }], // multiple answers
  explanation: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("MSQQuestion", msqQuestionSchema);
