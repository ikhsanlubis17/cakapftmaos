<?php
$a = App\Models\RepairApproval::with(['inspection.user', 'approver'])->latest()->first();
if ($a) {
    echo "Approval ID: " . $a->id . "\n";
    echo "Approved By ID: " . $a->approved_by . "\n";
    echo "Approver Name: " . ($a->approver ? $a->approver->name : 'None') . "\n";
    echo "Approver Role: " . ($a->approver ? $a->approver->role : 'None') . "\n";
    
    echo "Inspection User ID: " . $a->inspection->user_id . "\n";
    echo "Inspection User Name: " . ($a->inspection->user ? $a->inspection->user->name : 'None') . "\n";
    echo "Inspection User Role: " . ($a->inspection->user ? $a->inspection->user->role : 'None') . "\n";
} else {
    echo "No approval found\n";
}
