<?php
$a = App\Models\RepairApproval::with(['inspection.user', 'approver'])->latest()->first();
if ($a) {
    echo "Approver: " . ($a->approver ? $a->approver->name : 'None') . "\n";
    echo "Requester: " . ($a->inspection && $a->inspection->user ? $a->inspection->user->name : 'None') . "\n";
} else {
    echo "No approval found\n";
}
