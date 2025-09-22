import mongoose from "mongoose";
const { Schema } = mongoose;

const textQuestionSchema = new Schema({
  type: { type: String, default: "text" },
  text: { type: String, required: true },
  correctAnswer: { type: String }, // text answer
  explanation: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("TextQuestion", textQuestionSchema);
