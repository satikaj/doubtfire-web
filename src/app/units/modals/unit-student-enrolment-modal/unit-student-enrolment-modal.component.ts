import { Component, Input, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { alertService, CampusService } from 'src/app/ajs-upgraded-providers';

@Component({
  selector: 'unit-student-enrolment-modal',
  templateUrl: 'unit-student-enrolment-modal.component.html',
  styleUrls: ['unit-student-enrolment-modal.component.scss'],
})
export class UnitStudentEnrolmentModalComponent {
  unit: any;
  campuses: any = [];
  projects: any;
  student_id: string;
  campus_id: any;
  this;

  constructor(
    public dialogRef: MatDialogRef<UnitStudentEnrolmentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(alertService) public alert: any,
    @Inject(CampusService) public campusService: any
  ) {}

  ngOnInit() {
    this.unit = this.data.unit;
    this.projects = this.data.unit.students;
    this.campusService.query().subscribe((campuses: any) => {
      this.campuses = campuses;
    });
    console.log(this.unit);
    console.log(this.projects);
  }

  enrolStudent(student_id, campus_id) {
    console.log(this.unit.id, student_id, campus_id);
    if (campus_id == null) {
      this.alert.add('danger', 'Campus missing. Please indicate student campus', 5000);
      return;
    }

    return this.unit.$create(
      { unit_id: this.unit.id, student_num: student_id, campus_id: campus_id },
      (project: { project_id }) => {
        if (!this.unit.studentEnrolled(project.project_id)) {
          this.alert.add('success', 'Student enrolled', 2000);
        } else {
          this.alert.add('danger', 'Student is already enrolled', 2000);
        }
      },
      (response: { data: { error } }) =>
        this.alert.add('danger', `Error enrolling student: ${response.data.error}`, 6000)
    );
  }
}
