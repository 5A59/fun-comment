// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const resizeImg = require('resize-image-buffer');
const fs = require('fs');
let getPixels = require("get-pixels")
let figlet = require('figlet');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let chooseImage = vscode.commands.registerTextEditorCommand(
		'fun-comment.chooseImage',
		async (textEditor, edit, args) => {
			const uri = await vscode.window.showOpenDialog({
				canSelectFolders: false,
				canSelectMany: false,
				filters: {
					images: ['png', 'jpg'],
				},
			}) as any
			if (uri && uri.length > 0) {
				const image = uri[0].fsPath
				const type = 'image/' + image.split('.')[image.split('.').length - 1]
				const tinifyImage = await resizeImg(fs.readFileSync(image), {
					width: 50,
					height: 50,
				});
				getPixels(tinifyImage, type, (err: any, pixels: any) => {
					if (!err) {
						let ascii = toAscii(pixels.data)
						let editor = vscode.window.activeTextEditor
						if (editor) {
							let selection = editor.selection;
							if (ascii) {
								let result = wrapAscii(ascii, getFileType(editor.document.fileName))
								editor.edit((editBuilder: any) => {
									editBuilder.replace(selection, result);
								});
							}
						}
					}
				})
			}
		}
	)

	let replaceText = vscode.commands.registerTextEditorCommand(
		'fun-comment.replaceText',
		async (textEditor, edit, args) => {
			let editor = vscode.window.activeTextEditor
			if (editor) {
				let selection = editor.selection;
				let document = editor.document;
				let selectedText = document.getText(selection);
				let ascii = figlet.textSync(selectedText)
				if (ascii) {
					let result = wrapAscii(ascii, getFileType(editor.document.fileName))
					editor.edit((editBuilder: any) => {
						editBuilder.replace(selection, result);
					});
				}
			}
		}
	)

	context.subscriptions.push(chooseImage);
	context.subscriptions.push(replaceText);
}


const size = {
	width: 50,
	height: 50
}

function toAscii(data: any) {
	const diving = size.width * 4;
	//转换灰度图
	const arr = ["M", "N", "H", "Q", "$", "O", "C", "?", "7", ">", "!", ":", "–", ";", "."]
	const result = [];
	for (let i = 0, len = data.length; i < len; i += 4) {
		const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
		const num = Math.floor(avg / 18);
		result.push(arr[num]);
		if ((i + 4) % diving == 0 && i != 0) {
			result.push('\n');
		}
	}
	return result.toString()
}

function getFileType(filename: string) {
	let array = filename.split('.')
	return array[array.length - 1]
}

function wrapAscii(ascii: any, type: string) {
	let userConfig = vscode.workspace.getConfiguration();
	//let favoriteFont = userConfig.get('favoriteFont');
	let needWrap = userConfig.get('needWrap');
	if (!needWrap) {
		return ascii
	}
	switch (type) {
		case 'py':
			return '```\n' + ascii + '\n```'
		default:
			return '/**\n' + ascii + '\n*/'
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }
