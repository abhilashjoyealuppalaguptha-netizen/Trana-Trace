`timescale 1ns/1ps

module tb_click_detector;
reg clk, rst, btn_raw;
wire [1:0] click_count;
wire click_valid;

integer p = 0;
integer f = 0;

click_detector #(
    .DEBOUNCE_MAX(20'd2),
    .WINDOW_MAX(25'd12)
) uut (
    .clk(clk),
    .rst(rst),
    .btn_raw(btn_raw),
    .click_count(click_count),
    .click_valid(click_valid)
);

initial clk = 0;
always #5 clk = ~clk;

task check_count;
    input [1:0] expected;
    input integer id;
    begin
        wait(click_valid === 1'b1);
        #1;
        if (click_count === expected) begin
            $display("PASS[%0d] click_count=%0d", id, click_count);
            p = p + 1;
        end else begin
            $display("FAIL[%0d] got=%0d exp=%0d @%0t", id, click_count, expected, $time);
            f = f + 1;
        end
        @(posedge clk);
    end
endtask

task press_release;
    begin
        btn_raw <= 1'b0;
        repeat (4) @(posedge clk);
        btn_raw <= 1'b1;
        repeat (4) @(posedge clk);
    end
endtask

initial begin
    $dumpfile("tb_click_detector.vcd");
    $dumpvars(0, tb_click_detector);
    $display("=== click_detector testbench ===");

    rst = 1'b1;
    btn_raw = 1'b1;
    repeat (4) @(posedge clk);
    rst = 1'b0;
    repeat (2) @(posedge clk);

    press_release();
    check_count(2'd1, 1);

    press_release();
    press_release();
    check_count(2'd2, 2);

    press_release();
    press_release();
    press_release();
    press_release();
    check_count(2'd3, 3);

    $display("--- %0d passed, %0d failed ---", p, f);
    if (f != 0) $fatal(1);
    $finish;
end

endmodule
