import { Component } from '@angular/core';
import { ShootingAreaComponent } from './components/shooting-area/shooting-area.component';

@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [
    ShootingAreaComponent
  ],
  templateUrl: './playground.component.html',
  styleUrl: './playground.component.scss'
})
export class PlaygroundComponent {

}
