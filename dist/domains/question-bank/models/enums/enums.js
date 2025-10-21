"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionTypeValues = exports.DifficultyValues = exports.QuestionType = exports.Difficulty = void 0;
var Difficulty;
(function (Difficulty) {
    Difficulty["EASY"] = "EASY";
    Difficulty["MEDIUM"] = "MEDIUM";
    Difficulty["HARD"] = "HARD";
})(Difficulty = exports.Difficulty || (exports.Difficulty = {}));
var QuestionType;
(function (QuestionType) {
    QuestionType["MCQ"] = "MCQ";
    QuestionType["TRUE_FALSE"] = "TRUE_FALSE";
    QuestionType["ESSAY"] = "ESSAY";
})(QuestionType = exports.QuestionType || (exports.QuestionType = {}));
exports.DifficultyValues = Object.values(Difficulty);
exports.QuestionTypeValues = Object.values(QuestionType);
