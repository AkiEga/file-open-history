import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		// let uri:vscode.Uri = new vscode.Uri("hogefuga");
		// assert.strictEqual(myExtension.output_history("hogefuga",-1),"");
	});
});
