import {Component} from "@angular/core";
import {ExpressionEditorComponent} from "./expression-editor.component";
import {CloseExpressionEditor} from "../../../action-events";
import {EventHubService} from "../../../services/event-hub/event-hub.service";

@Component({
    selector: "expression-editor-sidebar-component",
    directives: [
        ExpressionEditorComponent
    ],
    template: `
            <div class="sidebar-component">
                    
                    <div class="collapse-icon" (click)="collapseSidebar()">
                        <i class="fa fa-lg fa-caret-left"></i>
                    </div>
                    
                    <expression-editor></expression-editor>
            </div>
    `
})
export class ExpressionEditorSidebarComponent {
    constructor(private eventHubService: EventHubService) { }

    private collapseSidebar(): void {
        this.eventHubService.publish(new CloseExpressionEditor());
    }
}
