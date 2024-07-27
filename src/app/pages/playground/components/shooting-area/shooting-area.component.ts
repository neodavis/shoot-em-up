import { AfterViewInit, Component, computed, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { ShootingAreaService } from '../../services/shooting-area.service';
import { ShootingArea } from '../../models/shooting-area.model';
import Difficulty = ShootingArea.Difficulty;
import { Button } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, PercentPipe } from '@angular/common';
import { interval, startWith, take, tap } from 'rxjs';

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
    DatePipe
  ],
  templateUrl: './shooting-area.component.html',
  styleUrl: './shooting-area.component.scss',
  providers: [ShootingAreaService],
})
export class ShootingAreaComponent implements AfterViewInit {
  @ViewChild('shootingArea') shootingArea!: ElementRef<SVGElement>;

  private readonly shootingAreaService = inject(ShootingAreaService);

  readonly statistics = this.shootingAreaService.statistics;
  readonly stopwatch = this.shootingAreaService.stopwatch;
  readonly running = this.shootingAreaService.running;
  readonly countdown = signal<number | null>(null);
  readonly ratio = computed(() => {
    const { hit, miss } = this.statistics()

    return hit / (hit + miss) || 0;
  })
  readonly startAudio = new Audio('assets/countdown-sound.wav');
  readonly stopAudio = new Audio('assets/finish.wav');
  readonly difficulties = [
    { label: 'Easy (3600ms/target)', value: Difficulty.Easy },
    { label: 'Medium (2400ms/target)', value: Difficulty.Medium },
    { label: 'Hard (1800ms/target)', value: Difficulty.Hard },
  ];
  readonly difficultyControl = new FormControl<Difficulty>(Difficulty.Easy);

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
            this.shootingAreaService.start(this.difficultyControl.value!);
            this.countdown.set(null);
          } else {
            this.countdown.set(transformedValue);
          }
        })
      )
      .subscribe()
  }

  stop() {
    this.stopAudio.volume = 0.2;
    this.stopAudio.play()

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
}
