// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
//import { env } from 'process';
import * as vscode from 'vscode';
// import * as os from 'os';
import * as fs from 'fs';

// global variable
const DUMMY_LINE_NUM:number = -1;
let current_platform:string;

// function 
function gen_date_str(){
	let ret:string = "";
	let date:string = new Date().toISOString();
	ret = `[${date}]`;

	return ret;
}
function gen_open_file_log(file_path:string, line:number){
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

	return ret;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {	
	// init variable
	let past_file_path:string = "";
	let past_line:number = DUMMY_LINE_NUM;
	current_platform = process.platform;
	
	// init output ch
	let out_ch:vscode.OutputChannel = vscode.window.createOutputChannel("Opened File");
	let past_out_ch_str:string = "";
	out_ch.show();

	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection((event)=>{
			past_file_path = event?.textEditor.document.uri.fsPath;
			past_line = event?.textEditor.selection.active.line;
		})
	);
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor((event)=>{
			let ch_str:string = gen_open_file_log(past_file_path, past_line);
			if(ch_str !== past_out_ch_str && ch_str !== ""){	
				out_ch.appendLine(`${gen_date_str()} ${ch_str}`);
				past_out_ch_str = ch_str;
			}
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
