import {Component, ElementRef, ViewChild} from '@angular/core';

@Component({
  selector: 'f-task-feedback-templates',
  templateUrl: './task-feedback-templates.component.html',
})
export class TaskFeedbackTemplatesComponent {
  searchTerm: string = '';
  hoveredTemplate: string = '';

  categories = [
    {name: 'TLO', templates: ['Template A1', 'Template A2', 'Template A3', 'Template A4']},
    {name: 'ULO', templates: ['Template B1', 'Template B2', 'Template B3', 'Template B4']},
    {name: 'CLO', templates: ['Template C1', 'Template C2', 'Template C3', 'Template C4']},
    {name: 'GLO', templates: ['Template D1', 'Template D2', 'Template D3', 'Template D4']},
    {name: 'Section', templates: ['Template E1', 'Template E2', 'Template E3', 'Template E4']},
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
  @ViewChild('cloSection') cloSection!: ElementRef;
  @ViewChild('gloSection') gloSection!: ElementRef;
  @ViewChild('sectionSection') sectionSection!: ElementRef;

  scrollToSection(event: any) {
    const sections = [
      this.tloSection,
      this.uloSection,
      this.cloSection,
      this.gloSection,
      this.sectionSection,
    ];
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
