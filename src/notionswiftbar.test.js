import { sortTodoProjectFirst, TodoGroup } from './notionswiftbar.60s'

test('should sort the groups so the Todo project always comes first', () => {
	const todoGroup = new TodoGroup('Todo')
	const fooGroup = new TodoGroup('Foo')
	const barGroup = new TodoGroup('Bar')

	expect(
		[todoGroup, fooGroup, barGroup].sort(sortTodoProjectFirst)
	).toStrictEqual(
		[todoGroup, fooGroup, barGroup]
	);

	expect(
		[fooGroup, todoGroup, barGroup].sort(sortTodoProjectFirst)
	).toStrictEqual(
		[todoGroup, fooGroup, barGroup]
	);

	expect(
		[fooGroup, barGroup, todoGroup].sort(sortTodoProjectFirst)
	).toStrictEqual(
		[todoGroup, fooGroup, barGroup]
	);
});
