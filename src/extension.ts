// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
//import { env } from 'process';
import * as vscode from 'vscode';
// import * as os from 'os';
import * as fs from 'fs';

// const variable
const DUMMY_LINE_NUM:number = -1;

// global variable
let current_platform:string;
let out_ch:vscode.OutputChannel;

// private function 
export function output_history(file_path:string, line:number){
	let ret:string = "";

	// Error case
	if(line === DUMMY_LINE_NUM){
		return ret;
	}

	if( fs.existsSync(file_path) === false){
		return ret;
	}
	
	// Normal case
	switch(current_platform){
		case "win32":
			// ref)Link to a file position in Output Channel · Issue #586 · microsoft/vscode
			// https://github.com/microsoft/vscode/issues/586
			file_path = file_path.replace(/\\/g,"/");
			ret = `file:///${file_path}#${line+1}`;
			break;
		case "darwin":
		case "freebsd":
		case "linux":
		case "openbsd":
		case "sunos":
			ret = `file:///${file_path}:${line+1}`;
		default:
			// no action (ret = "";)
			break;
	}
	if(ret !== ""){
		let date:string = new Date().toISOString();
		ret = `[${date}] ${ret}`
		out_ch.appendLine(ret);
	}

	return ret;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {	
	// init variable
	let past_line:number = DUMMY_LINE_NUM;
	current_platform = process.platform;
	
	// init output ch
	out_ch = vscode.window.createOutputChannel("File Open History(file-open-history)");
	out_ch.show();

	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection((event)=>{
			let file_path = event?.textEditor.document.uri.fsPath??"";
			let line = event?.textEditor.selection.active.line??DUMMY_LINE_NUM;

			if(line < past_line -1 || past_line +1 < line){
				output_history(file_path, line);
			}

			past_line = line;
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
