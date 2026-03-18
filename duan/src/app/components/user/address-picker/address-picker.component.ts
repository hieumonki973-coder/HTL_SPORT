import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddressService, Address } from '../../../services/Address.service';
import Swal from 'sweetalert2';

// Danh sách tỉnh thành phổ biến (có thể thay bằng API GHN/GHTK)
export const PROVINCES = [
  'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu','Bắc Ninh','Bến Tre',
  'Bình Định','Bình Dương','Bình Phước','Bình Thuận','Cà Mau','Cần Thơ','Cao Bằng',
  'Đà Nẵng','Đắk Lắk','Đắk Nông','Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang',
  'Hà Nam','Hà Nội','Hà Tĩnh','Hải Dương','Hải Phòng','Hậu Giang','Hòa Bình','Hưng Yên',
  'Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng','Lạng Sơn','Lào Cai','Long An',
  'Nam Định','Nghệ An','Ninh Bình','Ninh Thuận','Phú Thọ','Phú Yên','Quảng Bình',
  'Quảng Nam','Quảng Ngãi','Quảng Ninh','Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh',
  'Thái Bình','Thái Nguyên','Thanh Hóa','Thừa Thiên Huế','Tiền Giang','TP. Hồ Chí Minh',
  'Trà Vinh','Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái'
];

@Component({
  selector: 'app-address-picker',
  templateUrl: './address-picker.component.html',
  styleUrls: ['./address-picker.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class AddressPickerComponent implements OnInit {
  /** Địa chỉ đang được chọn (truyền xuống checkout) */
  @Output() addressSelected = new EventEmitter<Address>();
  /** Tên + phone từ user để pre-fill */
  @Input() defaultName = '';
  @Input() defaultPhone = '';

  addresses: Address[] = [];
  selectedAddress: Address | null = null;

  // UI state
  isDropdownOpen = false;
  isFormOpen = false;
  editingAddress: Address | null = null;
  isSaving = false;
  isLoading = true;

  provinces = PROVINCES;
  addressForm!: FormGroup;

  constructor(private fb: FormBuilder, private addressService: AddressService) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadAddresses();
  }

  private buildForm(addr?: Address): void {
    this.addressForm = this.fb.group({
      fullName: [addr?.fullName || this.defaultName, Validators.required],
      phone:    [addr?.phone    || this.defaultPhone, [Validators.required, Validators.pattern(/^(0[0-9]{9})$/)]],
      tinh:     [addr?.tinh    || '', Validators.required],
      quan:     [addr?.quan    || '', Validators.required],
      phuong:   [addr?.phuong  || '', Validators.required],
      duong:    [addr?.duong   || '', Validators.required],
      soNha:    [addr?.soNha   || '', Validators.required],
      isDefault:[addr?.isDefault || false]
    });
  }

  loadAddresses(): void {
    this.isLoading = true;
    this.addressService.getMyAddresses().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.addresses = res.data || [];
        // Tự động chọn địa chỉ mặc định
        const def = this.addresses.find(a => a.isDefault) || this.addresses[0] || null;
        if (def) this.selectAddress(def);
      },
      error: () => { this.isLoading = false; }
    });
  }

  selectAddress(addr: Address): void {
    this.selectedAddress = addr;
    this.isDropdownOpen = false;
    this.addressSelected.emit(addr);
  }

  openAddForm(): void {
    this.editingAddress = null;
    this.buildForm();
    this.isFormOpen = true;
    this.isDropdownOpen = false;
  }

  openEditForm(addr: Address, event: Event): void {
    event.stopPropagation();
    this.editingAddress = addr;
    this.buildForm(addr);
    this.isFormOpen = true;
    this.isDropdownOpen = false;
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.editingAddress = null;
  }

  saveAddress(): void {
    this.addressForm.markAllAsTouched();
    if (this.addressForm.invalid) return;

    this.isSaving = true;
    const payload: Address = this.addressForm.getRawValue();

    const request$ = this.editingAddress
      ? this.addressService.updateAddress(this.editingAddress._id!, payload)
      : this.addressService.addAddress(payload);

    request$.subscribe({
      next: (res) => {
        this.isSaving = false;
        this.isFormOpen = false;
        this.loadAddresses();
        // Nếu vừa thêm/sửa → tự chọn luôn
        if (res.data) this.selectAddress(res.data);
        Swal.fire({ icon: 'success', title: this.editingAddress ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ', timer: 1500, showConfirmButton: false });
      },
      error: () => {
        this.isSaving = false;
        Swal.fire('Lỗi', 'Không thể lưu địa chỉ, vui lòng thử lại.', 'error');
      }
    });
  }

  deleteAddress(addr: Address, event: Event): void {
    event.stopPropagation();
    Swal.fire({
      title: 'Xóa địa chỉ?',
      text: 'Bạn có chắc muốn xóa địa chỉ này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#e53e3e'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.addressService.deleteAddress(addr._id!).subscribe({
        next: () => {
          if (this.selectedAddress?._id === addr._id) {
            this.selectedAddress = null;
            this.addressSelected.emit(undefined as any);
          }
          this.loadAddresses();
        }
      });
    });
  }

  setDefault(addr: Address, event: Event): void {
    event.stopPropagation();
    this.addressService.setDefault(addr._id!).subscribe({
      next: () => this.loadAddresses()
    });
  }

  getFullAddress(addr: Address): string {
    return [addr.soNha, addr.duong, addr.phuong, addr.quan, addr.tinh].filter(Boolean).join(', ');
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
}
