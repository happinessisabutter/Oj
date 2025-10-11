import { ProblemController } from '../controllers/problem.controller';

describe('ProblemController', () => {
    let controller: ProblemController;

    beforeEach(() => {
        controller = new ProblemController();
    });

    test('should create a problem', () => {
        const problemData = { title: 'Test Problem', description: 'This is a test problem' };
        const result = controller.create(problemData);
        expect(result).toEqual(expect.objectContaining(problemData));
    });

    test('should retrieve a problem by id', () => {
        const problemId = 1;
        const result = controller.getById(problemId);
        expect(result).toBeDefined();
        expect(result.id).toBe(problemId);
    });
});