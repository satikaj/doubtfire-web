import {Component, ElementRef, ViewChild, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'f-task-feedback-templates',
  styleUrl: './task-feedback-templates.component.scss',
  templateUrl: './task-feedback-templates.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class TaskFeedbackTemplatesComponent {
  searchTerm: string = '';
  hoveredTemplate: string = '';

  categories = [
    {name: 'TLO', templates: ['Template A1', 'Template A2', 'Template A3', 'Template A4']},
    {name: 'ULO', templates: ['Template B1', 'Template B2', 'Template B3', 'Template B4']},
    {name: 'GLO', templates: ['Template D1', 'Template D2', 'Template D3', 'Template D4']},
  ];

  filteredCategories = [...this.categories];

  filterTemplates() {
    this.filteredCategories = this.categories.map((category) => ({
      ...category,
      templates: category.templates.filter((template) =>
        template.toLowerCase().includes(this.searchTerm.toLowerCase()),
      ),
    }));
  }

  @ViewChild('tloSection') tloSection!: ElementRef;
  @ViewChild('uloSection') uloSection!: ElementRef;
  @ViewChild('gloSection') gloSection!: ElementRef;

  scrollToSection(event: any) {
    const sections = [this.tloSection, this.uloSection, this.gloSection];
    const selectedSection = sections[event.index];

    if (selectedSection) {
      selectedSection.nativeElement.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  }

  selectTemplate(template: string) {
    console.log('Selected template:', template);
  }

  onHoverTemplate(template: string) {
    this.hoveredTemplate = template;
  }
}
