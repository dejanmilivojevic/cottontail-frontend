import {Injectable} from "@angular/core";
import {WebWorkerBuilderService} from "../../core/web-worker/web-worker-builder.service";
import {WebWorker} from "../../core/web-worker/web-worker";

import * as cwlSchemas from "cwlts/schemas";

declare const jsyaml;
declare const Ajv;

export interface ValidationResponse {
    isValidatableCwl: boolean,
    isValidCwl: boolean,
    isValidJSON: boolean,
    errors: {message: string, loc: string}[],
    warnings: {message: string, loc: string}[],
    class?: string
}

@Injectable()
export class CwlSchemaValidationWorkerService {

    private worker: WebWorker<any>;

    private schemas = {
        v1: cwlSchemas.schemas.v1,
        d2sb: cwlSchemas.schemas.d2sb
    };

    constructor(private workerBuilder: WebWorkerBuilderService) {

        this.worker = this.workerBuilder.create(this.workerFunction, [
            "ajv.min.js",
            "js-yaml.min.js"
        ], {
            schemas: this.schemas
        });
    }

    validate(content: string) {
        return this.worker.request(content);
    }

    destroy() {
        this.worker.terminate();
    }

    private workerFunction(content) {

        let json;
        const schemas = this.schemas;
        const response = {
            isValidatableCwl: false,
            isValidCwl: false,
            isValidJSON: false,
            errors: [{message: "Not valid file format", loc: "document"}],
            warnings: [],
            class: null
        };

        // First check if this is json or yaml content
        try {
            json = jsyaml.safeLoad(content, {json: true} as any);

            response.isValidJSON = true;
            response.errors = [];
        } catch (e) {
            return response;
        }

        // Then check if it has the class prop
        if (!json || !json.class) {
            return Object.assign(response, {
                errors: [{
                    loc: "document",
                    message: "Document is missing the “class” property."
                }]
            });
        }

        // Check if the class is a valid one
        if (["Workflow", "CommandLineTool", "ExpressionTool"].indexOf(json.class) === -1) {
            return Object.assign(response, {
                errors: [{
                    loc: "document",
                    message: "CWL class is not valid. Expected “Workflow”, “CommandLineTool” or “ExpressionTool”."
                }]
            });
        }

        response.isValidatableCwl = true;
        response.class = json.class;

        const cwlVersion = json.cwlVersion || "sbg:draft-2";
        const schemaMap = {
            "sbg:draft-2": {
                CommandLineTool: schemas.d2sb.cltSchema,
                Workflow: schemas.d2sb.wfSchema,
                ExpressionTool: schemas.d2sb.etSchema
            },
            "v1.0": {
                CommandLineTool: schemas.v1.cltSchema,
                Workflow: schemas.v1.wfSchema,
                ExpressionTool: schemas.v1.etSchema
            }
        };

        const ajv = new Ajv();
        const validation = ajv.validate(schemaMap[cwlVersion][json.class], json);
        const errors = ajv.errors || [];

        return Object.assign(response, {
            isValidCwl: validation,
            errors: errors.map(err => {
                let message = err.message;
                if (err.keyword === "enum") {
                    message += ": " + err.params.allowedValues;
                }

                return {
                    message: message,
                    loc: `document${err.dataPath}`
                };
            }).reduce((acc, curr) => {
                acc = acc.filter(err => {
                    return err.message !== curr.message || err.loc !== curr.loc;
                });

                acc.push(curr);

                return acc;
            }, [])
        });


    }

}
