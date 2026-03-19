import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { School, Mail, Phone, MapPin, Save } from 'lucide-react';

export function AdminSettingsView() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3>Settings</h3>
        <p className="text-sm text-gray-600 mt-1">Manage school and system settings</p>
      </div>

      {/* School Information */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <School className="size-6 text-purple-600" />
          <h4>School Information</h4>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schoolName">School Name</Label>
              <Input id="schoolName" defaultValue="Sushil School" />
            </div>
            <div>
              <Label htmlFor="schoolCode">School Code</Label>
              <Input id="schoolCode" defaultValue="SS-2025" />
            </div>
          </div>
          <div>
            <Label htmlFor="schoolEmail">Email</Label>
            <Input id="schoolEmail" type="email" defaultValue="info@sushilschool.edu" />
          </div>
          <div>
            <Label htmlFor="schoolPhone">Phone</Label>
            <Input id="schoolPhone" type="tel" defaultValue="+1234567890" />
          </div>
          <div>
            <Label htmlFor="schoolAddress">Address</Label>
            <Input id="schoolAddress" defaultValue="123 Education Street, City, State, ZIP" />
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Save className="size-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </Card>

      {/* System Settings */}
      <Card className="p-6">
        <h4 className="mb-6">System Settings</h4>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-900">Enable Email Notifications</p>
              <p className="text-sm text-gray-600">Send email notifications for important updates</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-900">Enable SMS Notifications</p>
              <p className="text-sm text-gray-600">Send SMS alerts to parents and teachers</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-900">Automatic Attendance Reminders</p>
              <p className="text-sm text-gray-600">Send daily attendance reminders to teachers</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-900">Allow Student Self-Registration</p>
              <p className="text-sm text-gray-600">Let students create their own accounts</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>

      {/* Academic Year Settings */}
      <Card className="p-6">
        <h4 className="mb-6">Academic Year Settings</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="academicYear">Current Academic Year</Label>
              <Input id="academicYear" defaultValue="2024-2025" />
            </div>
            <div>
              <Label htmlFor="currentTerm">Current Term</Label>
              <Input id="currentTerm" defaultValue="Term 2" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="termStart">Term Start Date</Label>
              <Input id="termStart" type="date" />
            </div>
            <div>
              <Label htmlFor="termEnd">Term End Date</Label>
              <Input id="termEnd" type="date" />
            </div>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Save className="size-4 mr-2" />
            Update Academic Settings
          </Button>
        </div>
      </Card>

      {/* Attendance Settings */}
      <Card className="p-6">
        <h4 className="mb-6">Attendance Settings</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="attendanceTime">Attendance Marking Time Limit</Label>
            <Input id="attendanceTime" type="time" defaultValue="09:30" />
            <p className="text-xs text-gray-500 mt-1">Students arriving after this time will be marked late</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-900">Require Photo Verification</p>
              <p className="text-sm text-gray-600">Students must submit selfie for attendance</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-900">Require Location Verification</p>
              <p className="text-sm text-gray-600">Verify student location when marking attendance</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Save className="size-4 mr-2" />
            Save Attendance Settings
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <h4 className="text-red-600 mb-6">Danger Zone</h4>
        <div className="space-y-4">
          <div>
            <p className="text-gray-900 mb-2">Reset All Data</p>
            <p className="text-sm text-gray-600 mb-4">This will delete all data except user accounts. This action cannot be undone.</p>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
              Reset Data
            </Button>
          </div>
          <Separator />
          <div>
            <p className="text-gray-900 mb-2">Export All Data</p>
            <p className="text-sm text-gray-600 mb-4">Download a complete backup of all school data</p>
            <Button variant="outline">
              Export Data
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
