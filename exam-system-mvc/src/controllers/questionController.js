const Question = require('../models/Question');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Submission = require('../models/Submission');
const Result = require('../models/Result');

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

exports.postEditQuestion = async (req, res, next) => {
    try {
        let question = await Question.findById(req.params.id);
        
        if (!question) {
            throw new AppError('Question not found', 404);
        }
        
        // Authorization check
        if (question.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            throw new AppError('Not authorized to edit this question', 403);
        }

        // Base update data
        const updateData = {
            text: req.body.text,
            marks: req.body.marks,
            difficulty: req.body.difficulty || 'Medium',
            explanation: req.body.explanation || '',
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
        };

        // Store old correct answer for comparison
        let oldCorrectAnswer;
        let correctAnswerChanged = false;
        let correctOptionIndex;

        // Handle MCQ specific data
        if (question.type === 'MCQ') {
            let optionsArray = Array.isArray(req.body['options[]']) ? 
                             req.body['options[]'] : 
                             [req.body['options[]']];

            // Validate options
            if (!optionsArray || optionsArray.length < 2) {
                throw new AppError('MCQ questions must have at least 2 options', 400);
            }

            correctOptionIndex = parseInt(req.body.correctOption);
            
            // Validate correct option
            if (isNaN(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex >= optionsArray.length) {
                throw new AppError('Invalid correct option selected', 400);
            }

            // Store old correct answer
            oldCorrectAnswer = question.options.findIndex(opt => opt.isCorrect);

            // Format options with correct answer
            updateData.options = optionsArray.map((text, index) => ({
                text: text.trim(),
                isCorrect: index === correctOptionIndex
            }));

            // Check if correct answer changed
            correctAnswerChanged = oldCorrectAnswer !== correctOptionIndex;
        }

        // Handle image uploads using express-fileupload
        if (req.files && req.files.images) {
            const uploadedImages = Array.isArray(req.files.images) ? 
                                 req.files.images : 
                                 [req.files.images];

            const newImages = await Promise.all(uploadedImages.map(async (file, index) => {
                try {
                    // Upload to cloudinary
                    const result = await cloudinary.uploader.upload(file.tempFilePath, {
                        folder: 'exam-questions'
                    });
                    
                    return {
                        url: result.secure_url,
                        caption: req.body.captions ? 
                                (Array.isArray(req.body.captions) ? 
                                 req.body.captions[index] : 
                                 req.body.captions).trim() : 
                                ''
                    };
                } catch (error) {
                    console.error('Error uploading image:', error);
                    throw new AppError('Error uploading image', 500);
                }
            }));

            // Combine with existing images
            updateData.images = [...(question.images || []), ...newImages];
        }

        // Handle image deletions
        if (req.body.deleteImages) {
            const deleteIndices = Array.isArray(req.body.deleteImages) ? 
                                req.body.deleteImages.map(Number) : 
                                [Number(req.body.deleteImages)];
            
            // Keep only non-deleted images
            updateData.images = (updateData.images || question.images).filter((_, index) => 
                !deleteIndices.includes(index)
            );
        }

        // Update image captions for existing images
        if (req.body.existingImageCaptions && updateData.images) {
            const captions = Array.isArray(req.body.existingImageCaptions) ?
                           req.body.existingImageCaptions :
                           [req.body.existingImageCaptions];
            
            updateData.images = updateData.images.map((image, index) => ({
                ...image,
                caption: captions[index] ? captions[index].trim() : image.caption
            }));
        }

        // Update the question
        const updatedQuestion = await Question.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedQuestion) {
            throw new AppError('Failed to update question', 500);
        }

        // If correct answer changed, update related models
        if (correctAnswerChanged) {
            // 1. Update ExamAttempts
            const examAttempts = await ExamAttempt.find({
                'questions.question': question._id,
                status: 'SUBMITTED'
            });

            // 2. Update Submissions
            const submissions = await Submission.find({
                examId: question.examId,
                status: 'SUBMITTED',
                $or: [
                    { 'answers.questionId': question._id },
                    { 'tfAnswers.questionId': question._id }
                ]
            });

            // 3. Update Results
            const results = await Result.find({
                examId: question.examId,
                'questionResults.questionId': question._id
            });

            // Process each model's updates
            await Promise.all([
                // Update ExamAttempts
                ...examAttempts.map(async attempt => {
                    const questionAttempt = attempt.questions.find(q => 
                        q.question.toString() === question._id.toString()
                    );
                    if (questionAttempt) {
                        // Recalculate marks based on new correct answer
                        if (question.type === 'MCQ') {
                            const selectedOptionIndex = parseInt(questionAttempt.answer);
                            questionAttempt.marks = selectedOptionIndex === correctOptionIndex ? 
                                                  updatedQuestion.marks : 0;
                        }
                        // Recalculate total marks
                        attempt.totalMarks = attempt.questions.reduce((sum, q) => sum + q.marks, 0);
                        await attempt.save();
                    }
                }),

                // Update Submissions
                ...submissions.map(async submission => {
                    if (question.type === 'MCQ') {
                        const answer = submission.answers.find(a => 
                            a.questionId.toString() === question._id.toString()
                        );
                        if (answer) {
                            const selectedOptionIndex = parseInt(answer.selectedOption);
                            answer.isCorrect = selectedOptionIndex === correctOptionIndex;
                            answer.marksObtained = answer.isCorrect ? updatedQuestion.marks : 0;
                            submission.totalMarksObtained = submission.answers.reduce(
                                (sum, a) => sum + a.marksObtained, 0
                            );
                            await submission.save();
                        }
                    }
                }),

                // Update Results
                ...results.map(async result => {
                    const questionResult = result.questionResults.find(qr => 
                        qr.questionId.toString() === question._id.toString()
                    );
                    if (questionResult) {
                        if (question.type === 'MCQ') {
                            const submission = await Submission.findById(result.submissionId);
                            if (submission) {
                                const answer = submission.answers.find(a => 
                                    a.questionId.toString() === question._id.toString()
                                );
                                if (answer) {
                                    questionResult.isCorrect = answer.isCorrect;
                                    questionResult.obtainedMarks = answer.marksObtained;
                                    // Recalculate total marks and percentage
                                    result.obtainedMarks = result.questionResults.reduce(
                                        (sum, qr) => sum + qr.obtainedMarks, 0
                                    );
                                    result.percentage = (result.obtainedMarks / result.totalMarks) * 100;
                                    result.status = result.percentage >= 50 ? 'PASS' : 'FAIL';
                                    await result.save();
                                }
                            }
                        }
                    }
                })
            ]);

            req.flash('success', 'Question updated successfully. All related submissions and results have been recalculated.');
        } else {
            req.flash('success', 'Question updated successfully');
        }

        res.redirect(`/exams/${req.params.examId}/questions/${updatedQuestion._id}`);
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