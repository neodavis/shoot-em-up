import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import { ShootingAreaService } from '../../services/shooting-area.service';
import { ShootingArea } from '../../models/shooting-area.model';
import { Button } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, NgStyle, PercentPipe } from '@angular/common';
import { interval, take, tap } from 'rxjs';
import { InputNumberModule } from 'primeng/inputnumber';
import Difficulty = ShootingArea.Difficulty;
import Mode = ShootingArea.Mode;
import { DialogModule } from 'primeng/dialog';
import { ColorPickerModule } from 'primeng/colorpicker';

@Component({
  selector: 'app-shooting-area',
  standalone: true,
  imports: [
    Button,
    DropdownModule,
    TagModule,
    FormsModule,
    ReactiveFormsModule,
    PercentPipe,
    DatePipe,
    InputNumberModule,
    DialogModule,
    ColorPickerModule,
    NgStyle
  ],
  templateUrl: './shooting-area.component.html',
  styleUrl: './shooting-area.component.scss',
  providers: [ShootingAreaService],
})
export class ShootingAreaComponent implements AfterViewInit {
  @ViewChild('shootingArea') shootingArea!: ElementRef<SVGElement>;

  @HostListener('window:keydown.space', ['$event'])
  toggleShootingArea() {
    this.running() ? this.stop() :this.start();
  }

  @HostListener('window:keydown.alt.s', ['$event'])
  toggleViewSettings() {
    this.showViewSettings.set(true);
  }

  private readonly shootingAreaService = inject(ShootingAreaService);

  readonly showViewSettings = signal<boolean>(false);
  readonly statistics = this.shootingAreaService.statistics;
  readonly stopwatch = this.shootingAreaService.stopwatch;
  readonly running = this.shootingAreaService.running;
  readonly countdown = signal<number | null>(null);
  readonly ratio = computed(() => {
    const { hit, lost } = this.statistics()

    return hit / (hit + lost) || 0;
  })
  readonly accuracy = computed(() => {
    const { hit, miss } = this.statistics()

    return hit / (hit + miss) || 0;
  })
  readonly Mode = Mode;
  readonly startAudio = new Audio('assets/countdown-sound.wav');
  readonly difficulties = [
    { label: 'Easy (3600ms/target)', value: Difficulty.Easy },
    { label: 'Medium (2400ms/target)', value: Difficulty.Medium },
    { label: 'Hard (1800ms/target)', value: Difficulty.Hard },
  ];
  readonly difficultyControl = new FormControl<Difficulty>(Difficulty.Easy);
  readonly timerControl = new FormControl<number>(60);
  readonly targetScoreControl = new FormControl<number>(100);
  readonly modeControl = new FormControl<Mode>(Mode.Endless);
  readonly modes = [
    { label: 'Timer', value: Mode.Timer },
    { label: 'Endless', value: Mode.Endless },
    { label: 'Fixed Count', value: Mode.FixedCount },
  ];
  accentColor = signal<string>('#b7b9d0');
  viewSettings = computed(() => ({
    '--accent-color': this.accentColor(),
  }));

  ngAfterViewInit() {
    this.shootingAreaService.initializeArea(this.shootingArea.nativeElement);
  }

  start() {
    this.countdown.set(3);
    this.startAudio.volume = 0.2;
    this.startAudio.play()

    interval(1000)
      .pipe(
        take(3),
        tap((value) => {
          const transformedValue = 2 - value;

          if (transformedValue === 0) {
            this.shootingAreaService.start({
              mode: this.modeControl.value!,
              difficulty: this.difficultyControl.value!,
              timer: this.timerControl.value!,
              targetScore: this.targetScoreControl.value!
            });
            this.countdown.set(null);
          } else {
            this.countdown.set(transformedValue);
          }
        })
      )
      .subscribe()
  }

  stop() {
    this.shootingAreaService.stop();
  }

  shoot(event: MouseEvent) {
    const target = <HTMLElement>event.target;

    if (target.tagName === 'circle') {
      this.shootingAreaService.hitTarget(target.id);
    } else {
      this.shootingAreaService.missTarget();
    }
  }

  openViewSettings() {
    this.showViewSettings.set(true);
  }

  hideViewSettings() {
    this.showViewSettings.set(false);
  }
}
