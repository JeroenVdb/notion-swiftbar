#!/usr/bin/env node

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
// <swiftbar.environment>['databaseId':'c08eaef20d4b444b92867e5b4a689ffc']</swiftbar.environment>

import bitbar from 'bitbar';

import { Client } from '@notionhq/client';
const notion = new Client({ auth: process.env.NOTION_TODO_SECRET });

/**
 * Notion database id
 * @type {string} - Notion database id
 */
const DATABASE_ID = process.env.databaseId || 'c08eaef20d4b444b92867e5b4a689ffc';

/**
 * Interface for classes that connect to todo sources
 *
 * @interface TodoRepository
 */

/**
 * Get the todo items and convert them to a clean todo object
 *
 * @method
 * @name TodoRepository#fetchTodos
 * @returns {Promise<Todo[]>} An array containing todo items
 */

/**
 * Get todos from Notion
 * @implements {TodoRepository}
 */
export class NotionTodoRepository {
	constructor() {}

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
			notionTodo.properties.Priority ? notionTodo.properties.Priority.select.name : '',
			notionTodo.properties.Status ? notionTodo.properties.Status.select.name : '',
			notionTodo.properties.Project && notionTodo.properties.Project.multi_select.length > 0 ? notionTodo.properties.Project.multi_select[0].name : ''
		);
	}

	/**
	 * Fetch Notion todos
	 * @returns {Promise<import("@notionhq/client/build/src/api-endpoints").Page[]>}
	 */
	async getNotionTodos() {
		try {
			/**
			 * @type {import("@notionhq/client/build/src/api-endpoints").DatabasesQueryResponse }
			 */
			const response = await notion.databases.query({
				database_id: DATABASE_ID,
				filter: {
					and: [
						{
							property: 'Status',
							select: {
								does_not_equal: 'Completed',
							},
						},
						{
							property: 'Status',
							select: {
								does_not_equal: 'Chase',
							},
						},
						{
							property: 'Owner',
							select: {
								does_not_equal: 'Ludwig Van den Berghe',
							},
						},
					],
				},
				sorts: [
					{
						property: 'Priority',
						direction: 'ascending',
					},
				],
			});

			return response.results;
		} catch (e) {
			console.error(`Could not query the notion database: ${e.message}`);

			if (e.code === 'ENOTFOUND') {
				process.exit(0);
			}

			process.exit(1);
		}
	}

	/**
	 * Fetch Notion todos
	 * @returns {Promise<Todo[]>}
	 */
	async fetchTodos() {
		const notionTodos = await this.getNotionTodos();
		return notionTodos.filter(this.isValidTodo).map(this.toTodo);
	}
}

export class Todos {
	constructor(repository) {
		this.repository = repository;
	}

	async getAllOpenTodos() {
		if (!this.items) {
			this.items = await this.repository.fetchTodos();
		}

		return this.items;
	}

	/**
	 * Group todos by by project property
	 * @returns {{(string): TodoGroup}} - Map of groups
	 */
	async getOpenTodosGroupedByProject() {
		if (!this.items) {
			this.items = await this.repository.fetchTodos();
		}

		return this.groupBy('project');
	}

	/**
	 * Group todos by a todo property
	 * @param {string} propertyName - Property to group by
	 * @returns {{(string): TodoGroup}} - Map of groups
	 */
	groupBy(propertyName) {
		const groups = {};

		this.items.map((item) => {
			if (!groups.hasOwnProperty(item[propertyName])) {
				groups[item[propertyName]] = new TodoGroup(item[propertyName]);
			}

			groups[item[propertyName]].addTodo(item);
		});

		return groups;
	}
}

export class Todo {
	/**
	 * Create a single todo item
	 * @param {string} id
	 * @param {string} title
	 * @param {string | null} priority
	 * @param {string | null} status
	 * @param {string | null} project
	 */
	constructor(id, title, priority, status, project) {
		/** @type {string} */
		this.id = id;
		/** @type {string} */
		this.title = title;
		/** @type {string} */
		this.priority = priority;
		/** @type {string} */
		this.status = status;
		/** @type {string} */
		this.project = project;
		/** @type {string} */
		this.httpUrl = `https://notion.so/${this.id.replace(/-/g, '')}`;
		/** @type {string} */
		this.notionUrl = `notion://notion.so/${this.id.replace(/-/g, '')}`;
	}

	isPriorityHigh() {
		return this.priority && this.priority.includes('High')
	}
}

export class TodoGroup {
	/**
	 * Create a new todo group
	 * @param {string} name
	 */
	constructor(name) {
		/** @type {string} */
		this.name = name;
		/** @type {Todo[]} */
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
		const todosView = group.items.map(TodoView.todoToView).flat();
		return [
			bitbar.separator,
			{
				text: group.name,
			},
			...todosView,
		];
	}
}

class TodoView {
	/**
	 * Create a single todo view
	 * @param {Todo} todo
	 * @returns {SwiftbarView[]}
	 */
	static todoToView(todo) {
		return [
			{
				text: `${todo.status === 'In Progress' ? '🚧 ' : ''} ${todo.title} ${
					todo.isPriorityHigh() ? '\t(' + todo.priority + ')' : ''
				}`,
				href: todo.notionUrl,
			},
			{
				text: '-- Complete',
				bash: '/Users/jvandenberghe/Projects/notion-swiftbar/src/update-todo-status.js',
				param0: 'Completed',
				param1: todo.id,
				terminal: false,
			},
			{
				text: '-- In Progress',
				bash: '/Users/jvandenberghe/Projects/notion-swiftbar/src/update-todo-status.js',
				param0: 'In Progress',
				param1: todo.id,
				terminal: false,
			},
		];
	}
}

export function sortTodoProjectFirst(a) {
	if (a.name && a.name.includes('Todo')) {
		return -1;
	}

	return 0;
}

// Start

const todosRepository = new NotionTodoRepository();
const todos = new Todos(todosRepository);
const openTodos = await todos.getAllOpenTodos();
const groupedByProjectTodos = await todos.getOpenTodosGroupedByProject();

/**
 * @typedef {import("bitbar").bitbar.Options} SwiftbarView
 */

/** @type {SwiftbarView[]} */
const groupedByProjectTodosView = Object.values(groupedByProjectTodos)
	.sort(sortTodoProjectFirst)
	.map((group) => {
		return GroupedByTodoView.groupedByView(group);
	})
	.flat();

/** @type {SwiftbarView[]} */
const headerView = [
	{
		text: `${openTodos.length} 🎒`,
		dropdown: false,
	},
];

/** @type {SwiftbarView[]} */
const footerView = [
	bitbar.separator,
	{
		text: `Open in Notion`,
		href: 'notion://notion.so/jvandenberghe/c08eaef20d4b444b92867e5b4a689ffc?v=57de708ff176477bb57cfb1241c66d45',
	},
];

bitbar([...headerView, ...groupedByProjectTodosView, ...footerView]);
