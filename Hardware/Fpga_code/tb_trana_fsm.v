`timescale 1ns/1ps
module tb_trana_fsm;
reg clk, rst, click_valid, batt_low;
reg [1:0] click_count;
wire [1:0] fsm_state;
localparam NORMAL=0, FAKE_OFF=1, EMERGENCY=2, REAL_OFF=3;
trana_fsm uut(.clk(clk),.rst(rst),.click_count(click_count),.click_valid(click_valid),.batt_low(batt_low),.fsm_state(fsm_state));
initial clk=0; always #18.5 clk=~clk;
integer p=0,f=0;
task check; input [1:0] exp; input integer id;
begin #1; if(fsm_state===exp) begin $display("PASS[%0d] state=%0d",id,fsm_state); p=p+1; end
else begin $display("FAIL[%0d] got=%0d exp=%0d @%0t",id,fsm_state,exp,$time); f=f+1; end end endtask
task fire; input [1:0] cnt; begin @(posedge clk); click_count<=cnt; click_valid<=1; @(posedge clk); click_valid<=0; click_count<=0; @(posedge clk); end endtask
task fire_batt; begin @(posedge clk); batt_low<=1; @(posedge clk); batt_low<=0; @(posedge clk); end endtask
task do_rst; begin rst<=1; click_valid<=0; click_count<=0; batt_low<=0; repeat(4)@(posedge clk); rst<=0; @(posedge clk); end endtask
initial begin
$dumpfile("tb_trana_fsm.vcd"); $dumpvars(0,tb_trana_fsm);
$display("=== trana_fsm testbench ===");
do_rst; check(NORMAL,1);
fire(1); check(FAKE_OFF,2);
fire(3); check(NORMAL,3);
fire(2); check(REAL_OFF,4);
fire(1); check(NORMAL,5);
fire_batt; check(EMERGENCY,6);
fire(3); check(EMERGENCY,7);
do_rst; check(NORMAL,8);
fire(1); check(FAKE_OFF,9); fire(2); check(REAL_OFF,10);
do_rst; fire(1); fire_batt; check(EMERGENCY,11);
do_rst; fire(0); check(NORMAL,12);
$display("--- %0d passed, %0d failed ---",p,f);
$finish; end
endmodule
