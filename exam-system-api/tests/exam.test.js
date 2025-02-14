const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Exam = require('../src/models/Exam');

describe('Exam Routes', () => {
  let teacher;
  let student;
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
  });

  describe('POST /api/exams', () => {
    const examData = {
      title: 'Test Exam',
      description: 'Test Description',
      duration: 60,
      questions: [
        {
          text: 'Test Question',
          type: 'multiple_choice',
          options: ['Option 1', 'Option 2', 'Option 3'],
          correctAnswer: 'Option 1',
          points: 10,
        },
      ],
    };

    it('should create exam when teacher is authenticated', async () => {
      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('title', examData.title);
      expect(response.body).toHaveProperty('questions');
      expect(response.body.createdBy).toBe(teacher._id.toString());
    });

    it('should not create exam when student is authenticated', async () => {
      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(examData);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/exams', () => {
    beforeEach(async () => {
      await Exam.create({
        title: 'Test Exam 1',
        description: 'Description 1',
        duration: 60,
        questions: [
          {
            text: 'Question 1',
            type: 'multiple_choice',
            options: ['Option 1', 'Option 2'],
            correctAnswer: 'Option 1',
            points: 10,
          },
        ],
        createdBy: teacher._id,
      });
    });

    it('should get all exams when authenticated', async () => {
      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
    });

    it('should not get exams without authentication', async () => {
      const response = await request(app).get('/api/exams');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/exams/:id', () => {
    let exam;

    beforeEach(async () => {
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
        ],
        createdBy: teacher._id,
      });
    });

    it('should get exam by id when authenticated', async () => {
      const response = await request(app)
        .get(`/api/exams/${exam._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', exam._id.toString());
      expect(response.body).toHaveProperty('title', exam.title);
    });

    it('should not get exam with invalid id', async () => {
      const response = await request(app)
        .get('/api/exams/invalid-id')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/exams/:id', () => {
    let exam;

    beforeEach(async () => {
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
        ],
        createdBy: teacher._id,
      });
    });

    it('should update exam when teacher is authenticated', async () => {
      const updateData = {
        title: 'Updated Exam',
        description: 'Updated Description',
      };

      const response = await request(app)
        .put(`/api/exams/${exam._id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', updateData.title);
      expect(response.body).toHaveProperty('description', updateData.description);
    });

    it('should not update exam when student is authenticated', async () => {
      const response = await request(app)
        .put(`/api/exams/${exam._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Updated Exam' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/exams/:id', () => {
    let exam;

    beforeEach(async () => {
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
        ],
        createdBy: teacher._id,
      });
    });

    it('should delete exam when teacher is authenticated', async () => {
      const response = await request(app)
        .delete(`/api/exams/${exam._id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);

      const deletedExam = await Exam.findById(exam._id);
      expect(deletedExam).toBeNull();
    });

    it('should not delete exam when student is authenticated', async () => {
      const response = await request(app)
        .delete(`/api/exams/${exam._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);

      const existingExam = await Exam.findById(exam._id);
      expect(existingExam).not.toBeNull();
    });
  });
}); 