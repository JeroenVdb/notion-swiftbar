#!/usr/bin/env /Users/jvandenberghe/.nvm/versions/node/v14.16.0/bin/node

// <bitbar.title>Notion Todo</bitbar.title>
// <bitbar.version>v1.0</bitbar.version>
// <bitbar.author>Jeroen Van den Berghe</bitbar.author>
// <bitbar.author.github>jeroenvdb</bitbar.author.github>
// <bitbar.desc>Show Notion Todo list items</bitbar.desc>
// <bitbar.dependencies>node</bitbar.dependencies>

// <swiftbar.hideAbout>true</swiftbar.hideAbout>
// <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>
// <swiftbar.hideLastUpdated>true</swiftbar.hideLastUpdated>
// <swiftbar.hideDisablePlugin>true</swiftbar.hideDisablePlugin>
// <swiftbar.hideSwiftBar>true</swiftbar.hideSwiftBar>

import bitbar from 'bitbar';

import { Client } from '@notionhq/client';
const notion = new Client({ auth: process.env.NOTION_TODO_SECRET });

/**
 * Notion database id
 * @type {string} - Notion database id
 */
const DATABASE_ID = 'c08eaef20d4b444b92867e5b4a689ffc';

/**
 * Get todos from connected sources
 * @property {Todo[]} items - array of todo items
 */
class TodosRepository {
	constructor() {}

	async getAllOpenTodos() {
		if (!this.items) {
			await this.fetchTodos()
		}

		return this.items;
	}

	async getOpenTodosGroupedByProject() {
		if (!this.items) {
			await this.fetchTodos()
		}

		return this.groupBy('project');
	}

	async getOpenTodosGroupedByStatus() {
		if (!this.items) {
			await this.fetchTodos()
		}

		return this.groupBy('status');
	}

	/**
	 * Group todos by a todo property
	 * @param {string} group - Property to group by
	 * @returns {{(string): TodoGroup}} - Map of groups
	 */
	groupBy(group) {
		const groups = {};

		this.items.map(item => {
			if (!groups.hasOwnProperty(item[group])) {
				groups[item[group]] = new TodoGroup(item[group]);
			}

			groups[item[group]].addTodo(item)
		});

		return groups;
	}

	/**
	 * Returns true if the notionTodo is a proper page/todo
	 * @param notionTodo
	 * @returns {boolean}
	 */
	isValidTodo(notionTodo) {
		return notionTodo.properties.Name.title.length > 0;
	}

	/**
	 * Convert a Notion todo item to a todo item
	 * @param notionTodo
	 * @returns {Todo}
	 */
	toTodo(notionTodo) {
		return new Todo(
			notionTodo.id,
			notionTodo.properties.Name.title[0].plain_text,
			notionTodo.properties.Priority ? notionTodo.properties.Priority.select.name : null,
			notionTodo.properties.Status ? notionTodo.properties.Status.select.name : null,
			notionTodo.properties.Project ? notionTodo.properties.Project.multi_select[0].name : null,
		)
	}

	async fetchTodos() {
		this.items = []

		try {
			const response = await notion.databases.query(
				{
					database_id: DATABASE_ID,
					filter: {
						and: [{
							"property": "Status",
							"select": {
								"does_not_equal": "Completed"
							}
						},{
							"property": "Owner",
							"select": {
								"does_not_equal": "Ludwig Van den Berghe"
							}
						}]
					},
					sorts: [{
						property: 'Priority',
						direction: 'ascending',
					}]
				}
			);

			this.items = response.results.filter(this.isValidTodo).map(this.toTodo);
		} catch (e) {
			throw new Error(`Could not query the notion database: ${e.message}`)
		}
	}
}

/**
 * A single todo item
 * @property {string} id
 * @property {string} title
 * @property {string} priority
 * @property {string} status
 * @property {string} project
 * @property {string} httpUrl
 * @property {string} notionUrl
 */
class Todo {
	/**
	 * Create a single todo item
	 * @param {string} id
	 * @param {string} title
	 * @param {string} priority
	 * @param {string} status
	 * @param {string} project
	 */
	constructor(id, title, priority, status, project) {
		this.id = id;
		this.title = title;
		this.priority = priority;
		this.status = status;
		this.project = project;
		this.httpUrl = `https://notion.so/${this.id.replace(/-/g, '')}`;
		this.notionUrl = `notion://notion.so/${this.id.replace(/-/g, '')}`;
	}
}

/**
 * Get todos from connected sources
 * @property {string} name - Name of the todo group
 * @property {Todo[]} items - List of todo items that are part of this group
 */
export class TodoGroup {
	/**
	 * Create a new todo group
	 * @param {string} name
	 * @property {string} name - Name of the todo group
	 * @property {Todo[]} items - List of todo items that are part of this group
	 */
	constructor(name) {
		this.name = name;
		this.items = [];
	}

	/**
	 * Add a todo item to this group
	 * @param {Todo} todo
	 */
	addTodo(todo) {
		this.items.push(todo);
	}
}

class GroupedByTodoView {
	static groupedByView(group) {
		const todosView = group.items.map(TodoView.todoToView).flat()
		return [
			bitbar.separator,
			{
				text: group.name
			},
			...todosView
		]
	}
}

class TodoView {
	/**
	 * Create a single todo view
	 * @param {Todo} todo
	 * @returns {[]}
	 */
	static todoToView(todo) {
		return [{
			text: `${todo.status === 'In Progress' ? '🚧 ' : ''} ${todo.title} ${todo.priority.includes('High') ? '\t(' + todo.priority + ')' : ''}`,
			href: todo.notionUrl
		}, {
			text: '-- Complete',
			bash: '/Users/jvandenberghe/Projects/notion-swiftbar/src/update-todo-status.js',
			param0: 'Completed',
			param1: todo.id,
			terminal: false
		}, {
			text: '-- In Progress',
			bash: '/Users/jvandenberghe/Projects/notion-swiftbar/src/update-todo-status.js',
			param0: 'In Progress',
			param1: todo.id,
			terminal: false
		}]
	}
}

// Start

const todos = await new TodosRepository();
const openTodos = await todos.getAllOpenTodos();
const groupedByProjectTodos = await todos.getOpenTodosGroupedByProject();

const groupedByProjectTodosView = Object.values(groupedByProjectTodos).sort(sortTodoProjectFirst).map(group => {
	return GroupedByTodoView.groupedByView(group)
}).flat()

export function sortTodoProjectFirst(a) {
	if (a.name.includes('Todo')) {
		return -1;
	}

	return 0;
}

const headerView = [{
	text: `${openTodos.length} 🎒`,
	dropdown: false
}]

const footerView = [
	bitbar.separator,
	{
		text: `Open in Notion`,
		href: 'notion://notion.so/jvandenberghe/c08eaef20d4b444b92867e5b4a689ffc?v=57de708ff176477bb57cfb1241c66d45'
	}
]

bitbar([
	...headerView,
	...groupedByProjectTodosView,
	...footerView
]);
