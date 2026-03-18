import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [RouterModule, ReactiveFormsModule, CommonModule],

})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  registerF: FormGroup;
  loading = false;
  showLogin = true;
  col1BorderRadius = '0 30% 20% 0'; // Initial border-radius for col-1

  constructor(private authService: AuthService, private router: Router) {
    this.loginForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(6)]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });

    this.registerF = new FormGroup(
      {
        name: new FormControl('', [Validators.required, Validators.minLength(6)]),
        fullName: new FormControl('', [Validators.required]),
        email: new FormControl('', [Validators.required, Validators.email]),
        phone: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required, Validators.minLength(6)]),
        rePassword: new FormControl('', [Validators.required]),
      },
      { validators: this.passwordMatchValidator() }
    );

    // Update validators on password/rePassword changes
    this.registerF.get('password')?.valueChanges.subscribe(() => {
      this.registerF.updateValueAndValidity({ onlySelf: false, emitEvent: false });
    });
    this.registerF.get('rePassword')?.valueChanges.subscribe(() => {
      this.registerF.updateValueAndValidity({ onlySelf: false, emitEvent: false });
    });
  }

  ngOnInit() { }

  passwordMatchValidator(): ValidatorFn {
    return (form: AbstractControl): ValidationErrors | null => {
      return form.get('password')?.value === form.get('rePassword')?.value
        ? null
        : { mismatch: true };
    };
  }

  toggleForm(isLogin: boolean) {
    this.showLogin = isLogin;
    this.col1BorderRadius = isLogin ? '0 30% 20% 0' : '0 20% 30% 0';
  }

  onRegister() {
    if (this.registerF.invalid) {
      alert('Dữ liệu không hợp lệ');
      return;
    }
    this.loading = true;
    this.authService.register(this.registerF.value).subscribe({
      next: () => {
        alert('Bạn đã đăng ký thành công');
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi đăng ký:', err);
        const message = err.error?.message || 'Đăng ký thất bại, vui lòng thử lại.';
        alert(message);
        this.loading = false;
      }
    });
  }

  onLogin() {
    if (this.loginForm.invalid) {
      alert('Dữ liệu không hợp lệ');
      return;
    }
    this.loading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (data: any) => {
        alert('Đăng nhập thành công');
        localStorage.setItem('token', `Bearer ${data.accessToken}`);
        localStorage.setItem('login', JSON.stringify(data));
        this.router.navigate(['/home']);
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi đăng nhập:', err);
        if (err.status === 403) {
          alert('Sai mật khẩu');
        } else if (err.status === 404) {
          alert('Sai tên đăng nhập');
        } else if (err.status === 0) {
          alert('Không thể kết nối đến máy chủ.');
        } else {
          alert('Lỗi không xác định');
        }
        this.loading = false;
      }
    });
  }
}
