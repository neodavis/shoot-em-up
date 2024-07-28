import { Injectable, signal } from '@angular/core';
import { filter, interval, map, merge, startWith, Subscription, tap } from 'rxjs';
import { ShootingArea } from '../models/shooting-area.model';
import Mode = ShootingArea.Mode;

@Injectable()
export class ShootingAreaService {
  private readonly _statistics = signal<ShootingArea.Statistics>({ hit: 0, miss: 0, lost: 0 });
  private readonly _stopwatch = signal<number>(0);
  private readonly _difficulty = signal<ShootingArea.Difficulty>(ShootingArea.Difficulty.Easy);
  private readonly _mode = signal<ShootingArea.Mode>(ShootingArea.Mode.Endless);
  private readonly _targetScore = signal<number>(0);
  private readonly _timer = signal<number>(0);
  private readonly _totalTargets = signal<number>(0)

  private readonly _targets$ = signal<ShootingArea.Target[]>([]);
  private readonly _running = signal<boolean>(false);
  private readonly stopAudio = new Audio('assets/finish.wav');

  private _sessionSubscription: Subscription | null = null;
  private _shootingArea: SVGElement | null = null;

  get running() {
    return this._running.asReadonly();
  }

  get statistics() {
    return this._statistics.asReadonly();
  }

  get stopwatch() {
    return this._stopwatch.asReadonly();
  }

  get frequency() {
    return ShootingArea.difficultyFrequencyMap[this._difficulty()];
  }

  initializeArea(svgElement: SVGElement) {
    this._shootingArea = svgElement;
  }

  start(config: ShootingArea.Config) {
    this.resetStatistics();
    this.resetStopwatch();
    this._totalTargets.set(0);
    this._difficulty.set(config.difficulty);
    this._mode.set(config.mode);
    this._running.set(true);

    config.mode === Mode.Timer ? this._timer.set(config.timer) : this._targetScore.set(config.targetScore);

    const stopwatch$ = interval(1000)
      .pipe(
        tap(() => this._stopwatch.update(value => value + 1)),
        filter(() => !!this._timer() && this.stopwatch() === this._timer()),
        tap(() => this.stop()),
      );
    const targets$ = interval(this.frequency)
        .pipe(
          startWith(0),
          map(() => this.createTarget()),
          filter(() => this.running()),
          tap((target: ShootingArea.Target) => this._targets$.update(targets => [...targets, target])),
        );

    this._sessionSubscription = merge(stopwatch$, targets$).subscribe();
  }

  stop() {
    this._running.set(false);
    this._sessionSubscription?.unsubscribe();
    this._targets$().forEach((target) => target.destroy());
    this.stopAudio.volume = 0.2;
    this.stopAudio.play();
  }

  hitTarget(id: string) {
    this._statistics.update((statistics) => ({ ...statistics, hit: statistics.hit + 1 }));
    this._targets$().find(target => target.id === id)?.destroy();
  }

  missTarget() {
    this._statistics.update((statistics) => ({ ...statistics, miss: statistics.miss + 1 }));
  }

  destroyTarget(id: string) {
    this._targets$.update((targets) => targets.filter(target => target.id !== id));

    const { hit, lost } = this.statistics()

    if (this._targetScore() === this._totalTargets() && this._totalTargets() === hit + lost) {
      this.stop();
    }

    document.getElementById(id)?.remove();
  }

  private resetStatistics() {
    this._statistics.set({ hit: 0, miss: 0, lost: 0 });
  }

  private resetStopwatch() {
    this._stopwatch.set(0);
  }

  private createTarget(): ShootingArea.Target {
    const svgNS = "http://www.w3.org/2000/svg";
    const target = document.createElementNS(svgNS, 'circle');
    const maxX = this._shootingArea!.clientWidth;
    const maxY = this._shootingArea!.clientHeight;
    const x = Math.floor(Math.random() * (maxX + 1));
    const y = Math.floor(Math.random() * (maxY + 1));
    const lifetime = this.frequency * 3;
    const id = new Date().getTime().toString();

    target.style.r = (50).toString();
    target.style.cx = x.toString();
    target.style.cy = y.toString();
    target.setAttribute('stroke', 'white');
    target.setAttribute('id', id.toString());
    target.style.transition = `${lifetime}ms`;

    if (this._targetScore() !== this._totalTargets()) {
      this._shootingArea!.appendChild(target);
      this._totalTargets.update((total) => total + 1);
    }

    // TODO: avoid setTimeout (need to fix bug with wrong size on first render)
    setTimeout(() => target.style.r = (10).toString(), 100);

    const missAfterLifetime = setTimeout(() => {
      this._statistics.update((statistics) => ({ ...statistics, lost: statistics.lost + 1 }));
      this.destroyTarget(id);
    }, lifetime)

    return {
      id,
      destroy: () => {
        clearTimeout(missAfterLifetime);
        this.destroyTarget(id);
      },
    };
  }
}
