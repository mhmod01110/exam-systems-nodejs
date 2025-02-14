const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Exam = require('../src/models/Exam');
const Submission = require('../src/models/Submission');

describe('Submission Routes', () => {
  let teacher;
  let student;
  let exam;
  let teacherToken;
  let studentToken;

  beforeEach(async () => {
    teacher = await createTestUser(User, {
      email: 'teacher@example.com',
      role: 'teacher',
    });
    student = await createTestUser(User, {
      email: 'student@example.com',
      role: 'student',
    });
    teacherToken = generateTestToken(teacher);
    studentToken = generateTestToken(student);

    exam = await Exam.create({
      title: 'Test Exam',
      description: 'Description',
      duration: 60,
      questions: [
        {
          text: 'Question 1',
          type: 'multiple_choice',
          options: ['Option 1', 'Option 2'],
          correctAnswer: 'Option 1',
          points: 10,
        },
        {
          text: 'Question 2',
          type: 'true_false',
          correctAnswer: 'True',
          points: 5,
        },
      ],
      createdBy: teacher._id,
    });
  });

  describe('POST /api/exams/:examId/submissions', () => {
    const submissionData = {
      answers: [
        {
          question: '1',
          answer: 'Option 1',
        },
        {
          question: '2',
          answer: 'True',
        },
      ],
    };

    it('should create submission when student is authenticated', async () => {
      const response = await request(app)
        .post(`/api/exams/${exam._id}/submissions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(submissionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('student', student._id.toString());
      expect(response.body).toHaveProperty('exam', exam._id.toString());
      expect(response.body).toHaveProperty('answers');
      expect(response.body.answers).toHaveLength(2);
    });

    it('should not create submission for non-existent exam', async () => {
      const response = await request(app)
        .post('/api/exams/invalid-id/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(submissionData);

      expect(response.status).toBe(400);
    });

    it('should not create submission when teacher is authenticated', async () => {
      const response = await request(app)
        .post(`/api/exams/${exam._id}/submissions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(submissionData);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/exams/:examId/submissions', () => {
    beforeEach(async () => {
      await Submission.create({
        exam: exam._id,
        student: student._id,
        answers: [
          {
            question: exam.questions[0]._id,
            answer: 'Option 1',
          },
        ],
        score: 10,
      });
    });

    it('should get submissions when teacher is authenticated', async () => {
      const response = await request(app)
        .get(`/api/exams/${exam._id}/submissions`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('student', student._id.toString());
    });

    it('should not get submissions when student is authenticated', async () => {
      const response = await request(app)
        .get(`/api/exams/${exam._id}/submissions`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/exams/:examId/submissions/:id', () => {
    let submission;

    beforeEach(async () => {
      submission = await Submission.create({
        exam: exam._id,
        student: student._id,
        answers: [
          {
            question: exam.questions[0]._id,
            answer: 'Option 1',
          },
        ],
        score: 10,
      });
    });

    it('should get submission by id when teacher is authenticated', async () => {
      const response = await request(app)
        .get(`/api/exams/${exam._id}/submissions/${submission._id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', submission._id.toString());
      expect(response.body).toHaveProperty('student', student._id.toString());
    });

    it('should get own submission when student is authenticated', async () => {
      const response = await request(app)
        .get(`/api/exams/${exam._id}/submissions/${submission._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', submission._id.toString());
    });

    it('should not get other student\'s submission when student is authenticated', async () => {
      const otherStudent = await createTestUser(User, {
        email: 'other@example.com',
        role: 'student',
      });
      const otherStudentToken = generateTestToken(otherStudent);

      const response = await request(app)
        .get(`/api/exams/${exam._id}/submissions/${submission._id}`)
        .set('Authorization', `Bearer ${otherStudentToken}`);

      expect(response.status).toBe(403);
    });
  });
}); 