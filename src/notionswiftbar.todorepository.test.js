import {NotionTodoRepository, Todo} from './notionswiftbar.60s'
import {jest} from '@jest/globals'

let notionTodo = {}
let invalidNotionTodo = {}

beforeEach(() => {
	notionTodo = {
		"object": "page",
		"id": "468d94ac-2ca5-4547-b40c-952a2d0fbfe7",
		"created_time": "2021-06-02T15:47:00.000Z",
		"last_edited_time": "2021-07-02T11:21:00.000Z",
		"parent": {
			"type": "database_id",
			"database_id": "c08eaef2-0d4b-444b-9286-7e5b4a689ffc"
		},
		"archived": false,
		"properties": {
			"Project": {
				"id": "4'p1",
				"type": "multi_select",
				"multi_select": [
					{
						"id": "e626ccad-760d-44f7-8d24-b87f655b8513",
						"name": "Jobs around the house",
						"color": "green"
					}
				]
			},
			"Files": {
				"id": "Ng_H",
				"type": "files",
				"files": []
			},
			"Status": {
				"id": "OlC@",
				"type": "select",
				"select": {
					"id": "1",
					"name": "Not Started",
					"color": "red"
				}
			},
			"Priority": {
				"id": "[_Ky",
				"type": "select",
				"select": {
					"id": "ad7b3c41-8fa9-44b8-bb36-0f3751aea178",
					"name": "Medium",
					"color": "green"
				}
			},
			"Date created": {
				"id": "hG6n",
				"type": "created_time",
				"created_time": "2021-06-02T15:47:00.000Z"
			},
			"Project link": {
				"id": "m=tK",
				"type": "rich_text",
				"rich_text": []
			},
			"Name": {
				"id": "title",
				"type": "title",
				"title": [
					{
						"type": "text",
						"text": {
							"content": "Doucherand afkitten",
							"link": null
						},
						"annotations": {
							"bold": false,
							"italic": false,
							"strikethrough": false,
							"underline": false,
							"code": false,
							"color": "default"
						},
						"plain_text": "Doucherand afkitten",
						"href": null
					}
				]
			}
		},
		"url": "https://www.notion.so/Doucherand-afkitten-468d94ac2ca54547b40c952a2d0fbfe7"
	}
	invalidNotionTodo = {
		"object": "page",
		"id": "468d94ac-2ca5-4547-b40c-952a2d0fbfe7",
		"created_time": "2021-06-02T15:47:00.000Z",
		"last_edited_time": "2021-07-02T11:21:00.000Z",
		"parent": {
			"type": "database_id",
			"database_id": "c08eaef2-0d4b-444b-9286-7e5b4a689ffc"
		},
		"archived": false,
		"properties": {
			"Project": {
				"id": "4'p1",
				"type": "multi_select",
				"multi_select": [
					{
						"id": "e626ccad-760d-44f7-8d24-b87f655b8513",
						"name": "Jobs around the house",
						"color": "green"
					}
				]
			},
			"Files": {
				"id": "Ng_H",
				"type": "files",
				"files": []
			},
			"Status": {
				"id": "OlC@",
				"type": "select",
				"select": {
					"id": "1",
					"name": "Not Started",
					"color": "red"
				}
			},
			"Priority": {
				"id": "[_Ky",
				"type": "select",
				"select": {
					"id": "ad7b3c41-8fa9-44b8-bb36-0f3751aea178",
					"name": "Medium",
					"color": "green"
				}
			},
			"Date created": {
				"id": "hG6n",
				"type": "created_time",
				"created_time": "2021-06-02T15:47:00.000Z"
			},
			"Project link": {
				"id": "m=tK",
				"type": "rich_text",
				"rich_text": []
			},
			"Name": {
				"id": "title",
				"type": "title",
				"title": []
			}
		},
		"url": "https://www.notion.so/Doucherand-afkitten-468d94ac2ca54547b40c952a2d0fbfe7"
	}
});

test('should mark a todo as invalid when the title is still empty', async () => {
	const repo = new NotionTodoRepository();

	expect(repo.isValidTodo(notionTodo)).toBe(true)
	expect(repo.isValidTodo(invalidNotionTodo)).toBe(false)
});

test('should create a todo item from a notion todo item', async () => {
	const repo = new NotionTodoRepository();
	const todo = repo.toTodo(notionTodo);

	expect(todo).toBeInstanceOf(Todo);
	expect(todo.id).toBe('468d94ac-2ca5-4547-b40c-952a2d0fbfe7');
	expect(todo.title).toBe('Doucherand afkitten');
	expect(todo.project).toBe('Jobs around the house');
	expect(todo.status).toBe('Not Started');
	expect(todo.priority).toBe('Medium');
	expect(todo.httpUrl).toBe('https://notion.so/468d94ac2ca54547b40c952a2d0fbfe7');
	expect(todo.notionUrl).toBe('notion://notion.so/468d94ac2ca54547b40c952a2d0fbfe7');
});

afterEach(() => {
	jest.restoreAllMocks();
});
