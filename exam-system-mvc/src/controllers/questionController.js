const Question = require('../models/Question');
const Exam = require('../models/Exam');

// Display question list for an exam
exports.getQuestions = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId);
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        const questions = await Question.find({ examId: req.params.examId })
            .populate('createdBy', 'username firstName lastName');
        
        res.render('question/list', {
            title: `Questions - ${exam.title}`,
            exam,
            questions,
            user: req.user
        });
    } catch (error) {
        console.error('Error in getQuestions:', error);
        req.flash('error', 'Error fetching questions');
        res.redirect(`/exams/${req.params.examId}`);
    }
};

// Display question creation form
exports.getCreateQuestion = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId);
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        // Check if user is authorized to add questions
        if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to add questions to this exam');
            return res.redirect(`/exams/${exam._id}`);
        }
        
        res.render('question/create', {
            title: 'Add Question',
            exam,
            user: req.user
        });
    } catch (error) {
        console.error('Error in getCreateQuestion:', error);
        req.flash('error', 'Error loading question form');
        res.redirect(`/exams/${req.params.examId}`);
    }
};

// Handle question creation
exports.postCreateQuestion = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId);
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        // Check if user is authorized to add questions
        if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to add questions to this exam');
            return res.redirect(`/exams/${exam._id}`);
        }
        
        // Validate MCQ options if question type is MCQ
        if (req.body.type === 'MCQ') {
            if (!req.body.options || req.body.options.length < 2) {
                req.flash('error', 'MCQ questions must have at least 2 options');
                return res.redirect(`/exams/${exam._id}/questions/create`);
            }
            
            const correctOptions = req.body.options.filter(opt => opt.isCorrect);
            if (correctOptions.length !== 1) {
                req.flash('error', 'MCQ questions must have exactly one correct answer');
                return res.redirect(`/exams/${exam._id}/questions/create`);
            }
        }
        
        // Create question
        const question = await Question.create({
            ...req.body,
            examId: exam._id,
            createdBy: req.user._id
        });
        
        // Add question to exam
        exam.questions.push(question._id);
        await exam.save();
        
        req.flash('success', 'Question added successfully');
        res.redirect(`/exams/${exam._id}/questions`);
    } catch (error) {
        console.error('Error in postCreateQuestion:', error);
        req.flash('error', error.message || 'Error creating question');
        res.redirect(`/exams/${req.params.examId}/questions/create`);
    }
};

// Display question details
exports.getQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate('createdBy', 'username firstName lastName')
            .populate('examId', 'title type');
        
        if (!question) {
            req.flash('error', 'Question not found');
            return res.redirect(`/exams/${req.params.examId}/questions`);
        }
        
        res.render('question/detail', {
            title: 'Question Details',
            question,
            user: req.user
        });
    } catch (error) {
        console.error('Error in getQuestion:', error);
        req.flash('error', 'Error fetching question details');
        res.redirect(`/exams/${req.params.examId}/questions`);
    }
};

// Display question edit form
exports.getEditQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate('examId', 'title type');
        
        if (!question) {
            req.flash('error', 'Question not found');
            return res.redirect(`/exams/${req.params.examId}/questions`);
        }
        
        // Check if user is authorized to edit
        if (question.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to edit this question');
            return res.redirect(`/exams/${req.params.examId}/questions`);
        }
        
        res.render('question/edit', {
            title: 'Edit Question',
            question,
            user: req.user
        });
    } catch (error) {
        console.error('Error in getEditQuestion:', error);
        req.flash('error', 'Error fetching question for editing');
        res.redirect(`/exams/${req.params.examId}/questions`);
    }
};

// Handle question update
exports.postEditQuestion = async (req, res) => {
    try {
        let question = await Question.findById(req.params.id);
        
        if (!question) {
            req.flash('error', 'Question not found');
            return res.redirect(`/exams/${req.params.examId}/questions`);
        }
        
        // Check if user is authorized to edit
        if (question.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to edit this question');
            return res.redirect(`/exams/${req.params.examId}/questions`);
        }
        
        // Validate MCQ options if updating them
        if (req.body.options && question.type === 'MCQ') {
            if (req.body.options.length < 2) {
                req.flash('error', 'MCQ questions must have at least 2 options');
                return res.redirect(`/exams/${req.params.examId}/questions/${question._id}/edit`);
            }
            
            const correctOptions = req.body.options.filter(opt => opt.isCorrect);
            if (correctOptions.length !== 1) {
                req.flash('error', 'MCQ questions must have exactly one correct answer');
                return res.redirect(`/exams/${req.params.examId}/questions/${question._id}/edit`);
            }
        }
        
        question = await Question.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        
        req.flash('success', 'Question updated successfully');
        res.redirect(`/exams/${req.params.examId}/questions/${question._id}`);
    } catch (error) {
        console.error('Error in postEditQuestion:', error);
        req.flash('error', error.message || 'Error updating question');
        res.redirect(`/exams/${req.params.examId}/questions/${req.params.id}/edit`);
    }
};

// Handle question deletion
exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        
        if (!question) {
            req.flash('error', 'Question not found');
            return res.redirect(`/exams/${req.params.examId}/questions`);
        }
        
        // Check if user is authorized to delete
        if (question.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to delete this question');
            return res.redirect(`/exams/${req.params.examId}/questions`);
        }
        
        // Remove question from exam
        const exam = await Exam.findById(question.examId);
        if (exam) {
            exam.questions = exam.questions.filter(q => q.toString() !== question._id.toString());
            await exam.save();
        }
        
        await question.remove();
        
        req.flash('success', 'Question deleted successfully');
        res.redirect(`/exams/${req.params.examId}/questions`);
    } catch (error) {
        console.error('Error in deleteQuestion:', error);
        req.flash('error', 'Error deleting question');
        res.redirect(`/exams/${req.params.examId}/questions`);
    }
};

// Handle question image upload
exports.postUploadImage = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        
        if (!question) {
            req.flash('error', 'Question not found');
            return res.redirect(`/exams/${req.params.examId}/questions`);
        }
        
        // Check if user is authorized to upload
        if (question.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to upload images for this question');
            return res.redirect(`/exams/${req.params.examId}/questions`);
        }
        
        if (!req.files || !req.files.image) {
            req.flash('error', 'Please upload an image');
            return res.redirect(`/exams/${req.params.examId}/questions/${question._id}/edit`);
        }
        
        const file = req.files.image;
        
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
            req.flash('error', 'Please upload an image file');
            return res.redirect(`/exams/${req.params.examId}/questions/${question._id}/edit`);
        }
        
        // Create custom filename
        const filename = `question_${question._id}_${Date.now()}${path.extname(file.name)}`;
        
        // Move file to upload directory
        await file.mv(`./public/uploads/${filename}`);
        
        // Add image to question
        question.images.push({
            url: `/uploads/${filename}`,
            caption: req.body.caption || ''
        });
        await question.save();
        
        req.flash('success', 'Image uploaded successfully');
        res.redirect(`/exams/${req.params.examId}/questions/${question._id}/edit`);
    } catch (error) {
        console.error('Error in postUploadImage:', error);
        req.flash('error', 'Error uploading image');
        res.redirect(`/exams/${req.params.examId}/questions/${req.params.id}/edit`);
    }
};

// Display question type selection form
exports.getPlanQuestions = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId);
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        // Check if user is authorized to add questions
        if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to add questions to this exam');
            return res.redirect(`/exams/${exam._id}`);
        }
        
        res.render('question/select-types', {
            title: 'Plan Questions',
            exam,
            examId: exam._id,
            user: req.user
        });
    } catch (error) {
        console.error('Error in getPlanQuestions:', error);
        req.flash('error', 'Error loading question planning form');
        res.redirect(`/exams/${req.params.examId}`);
    }
};

// Handle question type selection and show bulk creation form
exports.postPlanQuestions = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId);
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        // Check if user is authorized to add questions
        if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to add questions to this exam');
            return res.redirect(`/exams/${exam._id}`);
        }

        const { mcqCount, trueFalseCount, shortAnswerCount, longAnswerCount } = req.body;
        
        // Validate that at least one question type is selected
        const totalQuestions = parseInt(mcqCount || 0) + 
                             parseInt(trueFalseCount || 0) + 
                             parseInt(shortAnswerCount || 0) + 
                             parseInt(longAnswerCount || 0);
        
        if (totalQuestions === 0) {
            req.flash('error', 'Please select at least one question to add');
            return res.redirect(`/exams/${exam._id}/questions/plan`);
        }
        
        res.render('question/create-planned', {
            title: 'Add Questions',
            exam,
            examId: exam._id,
            mcqCount: parseInt(mcqCount || 0),
            trueFalseCount: parseInt(trueFalseCount || 0),
            shortAnswerCount: parseInt(shortAnswerCount || 0),
            longAnswerCount: parseInt(longAnswerCount || 0),
            user: req.user
        });
    } catch (error) {
        console.error('Error in postPlanQuestions:', error);
        req.flash('error', 'Error processing question plan');
        res.redirect(`/exams/${req.params.examId}/questions/plan`);
    }
};

// Handle bulk question creation
exports.postCreateBulkQuestions = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId);
        
        if (!exam) {
            req.flash('error', 'Exam not found');
            return res.redirect('/exams');
        }
        
        // Check if user is authorized to add questions
        if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            req.flash('error', 'Not authorized to add questions to this exam');
            return res.redirect(`/exams/${exam._id}`);
        }

        const { questions } = req.body;
        
        if (!Array.isArray(questions)) {
            req.flash('error', 'Invalid question data');
            return res.redirect(`/exams/${exam._id}/questions/plan`);
        }

        // Format questions before creation
        const formattedQuestions = questions.map(question => {
            const formattedQuestion = {
                ...question,
                examId: exam._id,
                createdBy: req.user._id
            };

            // Format MCQ options
            if (question.type === 'MCQ' && Array.isArray(question.options)) {
                const correctOption = parseInt(question.correctOption);
                formattedQuestion.options = question.options.map((text, index) => ({
                    text,
                    isCorrect: index === correctOption
                }));
                delete formattedQuestion.correctOption;
            }

            // Format TrueFalse answer
            if (question.type === 'TrueFalse') {
                formattedQuestion.correctAnswer = question.correctAnswer.toString().toLowerCase();
            }

            // Format ShortAnswer and Essay
            if (question.type === 'ShortAnswer' || question.type === 'Essay') {
                formattedQuestion.correctAnswer = question.correctAnswer;
            }

            return formattedQuestion;
        });

        // Create all questions
        const createdQuestions = await Promise.all(
            formattedQuestions.map(async (questionData) => {
                const question = await Question.create(questionData);
                return question._id;
            })
        );

        // Add questions to exam
        exam.questions.push(...createdQuestions);
        await exam.save();
        
        req.flash('success', `Successfully added ${createdQuestions.length} questions`);
        res.redirect(`/exams/${exam._id}/questions`);
    } catch (error) {
        console.error('Error in postCreateBulkQuestions:', error);
        req.flash('error', error.message || 'Error creating questions');
        res.redirect(`/exams/${req.params.examId}/questions/plan`);
    }
}; 