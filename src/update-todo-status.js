#!/usr/bin/env /Users/jvandenberghe/.nvm/versions/node/v14.16.0/bin/node

import { Client } from '@notionhq/client';
const notion = new Client({ auth: process.env.NOTION_TODO_SECRET });

const parameters = process.argv.slice(2);
const newStatus = parameters[0]
const pageId = parameters[1]

console.log('Parameters: ', parameters);

console.log(`Change todo "${pageId}" to ${newStatus}`);

const response = await notion.pages.update({
	page_id: pageId,
	properties: {
		'Status': {
			'select': {
				'name': newStatus
			}
		}
	}
});

console.log(response);
