import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {FormPanelComponent} from "./elements/form-panel.component";
import {TooltipDirective} from "./ui/tooltip/tooltip.directive";
import {TooltipContentComponent} from "./ui/tooltip/tooltip-content.component";
import {CodeEditorComponent} from "./ui/code-editor/code-editor.component";
import {IpcService} from "../services/ipc.service";
import {GuidService} from "../services/guid.service";
import {CodePreviewComponent} from "./ui/code-editor/code-preview.component";
import {TreeViewComponent} from "./ui/tree-view/tree-view.component";
import {TreeNodeComponent} from "./ui/tree-view/tree-node.component";
import {TreeNodeIconComponent} from "./ui/tree-view/tree-node-icon.component";
import {MenuItemComponent} from "./ui/menu/menu-item.component";
import {MenuComponent} from "./ui/menu/menu.component";
import {ContextDirective} from "./ui/context/context.directive";
import {DisableFormControlDirective} from "./forms/disable-form-control.directive";
import {ContextService} from "./ui/context/context.service";
import {MultilangCodeEditorComponent} from "./ui/code-editor/multilang-code-editor.component";
import {ToggleComponent} from "./ui/toggle-slider/toggle-slider.component";
import {StatusBarComponent} from "./status-bar/status-bar.component";
import {MomentModule} from "angular2-moment";
import {DragDirective} from "./drag-and-drop/drag.directive";
import {DropDirective} from "./drag-and-drop/drop.directive";
import {DropZones} from "./drag-and-drop/drop-zones.directive";
import {LoggerDirective} from "./elements/debugger/logger.directive";
import {DragOverDirective} from "./drag-and-drop/drag-over.directive";
import {DropDownButtonComponent} from "./ui/dropdown-button/dropdown-button-component";
import {DropDownMenuComponent} from "./ui/dropdown-button/dropdown-menu.component";
import {WebWorkerBuilderService} from "./web-worker/web-worker-builder.service";
import {MarkdownService} from "./markdown/markdown.service";
import {MarkdownDirective} from "./markdown/markdown.directive";
import {TabsComponent} from "./ui/tabs/tabs.component";
import {TabComponent} from "./ui/tabs/tab.component";
import {InlineEditorComponent} from "./ui/inline-editor/inline-editor.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {KeyvalueComponent} from "./ui/inline-editor/keyvalue.component"


@NgModule({
    entryComponents: [
        DropDownMenuComponent,

        TooltipContentComponent,

        // Menu
        MenuItemComponent,
        MenuComponent,

        // Context
        // ContextDirective,

        // Code Editor Components
        MultilangCodeEditorComponent,

        TabsComponent,
        TabComponent,
        InlineEditorComponent,
        KeyvalueComponent
    ],
    declarations: [
        // Markdown directive
        MarkdownDirective,

        // Drop down button
        DropDownButtonComponent,
        DropDownMenuComponent,

        // Drag and Drop
        DragDirective,
        DropDirective,
        DragOverDirective,
        DropZones,

        // Disable Form Control
        DisableFormControlDirective,

        // Code Editor Components
        CodeEditorComponent,
        CodePreviewComponent,
        MultilangCodeEditorComponent,

        // Form Components
        FormPanelComponent,
        ToggleComponent,

        // Tree Components
        TreeViewComponent,
        TreeNodeComponent,
        TreeNodeIconComponent,

        // Tooltip
        TooltipContentComponent,
        TooltipDirective,

        // Menu
        MenuItemComponent,
        MenuComponent,

        // Context
        ContextDirective,

        StatusBarComponent,

        LoggerDirective,

        TabsComponent,
        TabComponent,
        InlineEditorComponent,
        KeyvalueComponent

    ],
    exports: [
        // Markdown directive
        MarkdownDirective,

        // Drop down button
        DropDownButtonComponent,

        // Drag and Drop
        DragDirective,
        DropDirective,
        DragOverDirective,
        DropZones,

        // Disable Form Control
        DisableFormControlDirective,

        // Code Editor
        CodeEditorComponent,
        CodePreviewComponent,
        MultilangCodeEditorComponent,

        // Forms
        FormPanelComponent,
        ToggleComponent,

        // Tooltip
        TooltipContentComponent,
        TreeNodeIconComponent,

        // Tree
        TreeViewComponent,

        // Directives
        TooltipDirective,

        // Menu
        MenuItemComponent,
        MenuComponent,

        // Context
        ContextDirective,

        StatusBarComponent,
        LoggerDirective,

        TabsComponent,
        TabComponent,
        InlineEditorComponent,
        KeyvalueComponent

    ],
    providers: [
        IpcService,
        GuidService,
        ContextService,
        WebWorkerBuilderService,
        MarkdownService

    ],
    imports: [BrowserModule, MomentModule, FormsModule, ReactiveFormsModule]
})
export class CoreModule {

}
