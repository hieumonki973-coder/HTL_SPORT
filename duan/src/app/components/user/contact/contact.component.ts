import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ContactService, Contact } from '../../../services/contact.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule]
})
export class ContactComponent {
  contact: Contact = {
    name: '',
    phone: '',
    email: '',
    message: ''
  };

  constructor(private contactService: ContactService) {}

  onSubmit() {
    const isGmail = /^[\w.+-]+@gmail\.com$/.test(this.contact.email);
    if (!isGmail) {
      alert('❌ Vui lòng nhập địa chỉ Gmail hợp lệ (ví dụ: hunghsps40750@gmail.com)');
      return;
    };

    const isPhoneValid = /^[0-9]{10}$/.test(this.contact.phone.toString());
  if (!isPhoneValid) {
    alert('❌ Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số.');
    return;
  }

    this.contactService.sendContact(this.contact)
      .subscribe({
        next: () => {
          alert('✅ Gửi liên hệ thành công!');
          this.contact = { name: '', phone: '', email: '', message: '' };
        },
        error: (err) => {
          alert('❌ Gửi thất bại. Kiểm tra lại server.');
          console.error(err);
        }
      });
  }
}
