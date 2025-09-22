//router/router.js

import { Router } from "express";
import * as controller from "../controllers/controller.js";

const router = Router();



// Quiz CRUD
router.route("/")
  .post(controller.createQuiz)
  .get(controller.getAllQuizzes);

router.route("/:quizid")
  .get(controller.getQuizById)
  .put(controller.updateQuiz)
  .delete(controller.deleteQuiz);

// Question CRUD (all scoped to a quiz)
router.route("/:quizid/questions")
  .get(controller.getQuestions)
  .post(controller.createQuestion)
  .delete(controller.dropQuestions);

router.route("/:quizid/questions/:qid")
  .get(controller.getQuestionById)
  .put(controller.updateQuestion)
  .delete(controller.deleteQuestion);

export default router;
