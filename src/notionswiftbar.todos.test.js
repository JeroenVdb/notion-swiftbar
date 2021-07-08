import {NotionTodoRepository, Todo, Todos} from './notionswiftbar.60s'
import {jest} from '@jest/globals'

let notionTodoRepositorySpy;

beforeEach(() => {
	const todoOne = new Todo('ID_1', 'TITLE', 'PRIORITY', 'STATUS', 'PROJECT_1')
	const todoTwo = new Todo('ID_2', 'TITLE', 'PRIORITY', 'STATUS', 'PROJECT_2')
	const todoThree = new Todo('ID_3', 'TITLE', 'PRIORITY', 'STATUS', 'PROJECT_1')
	notionTodoRepositorySpy = jest.spyOn(NotionTodoRepository.prototype, 'fetchTodos').mockImplementation(() => [todoOne, todoTwo, todoThree]);

});

test('should return all open todos', async () => {
	const repo = new NotionTodoRepository();
	const todos = new Todos(repo);
	const openTodos = await todos.getAllOpenTodos();
	expect(openTodos).toHaveLength(3)
});

test('should get todos, grouped by project', async () => {
	const repo = new NotionTodoRepository();
	const todos = new Todos(repo);

	const openTodosByProject = await todos.getOpenTodosGroupedByProject();

	expect(openTodosByProject).toHaveProperty('PROJECT_1')
	expect(openTodosByProject['PROJECT_1'].items).toHaveLength(2)

	expect(openTodosByProject).toHaveProperty('PROJECT_2')
	expect(openTodosByProject['PROJECT_2'].items).toHaveLength(1)
});

afterEach(() => {
	expect(notionTodoRepositorySpy).toBeCalledTimes(1)
	jest.restoreAllMocks();
});
