`timescale 1ns / 1ps

module tb_uart;

    reg clk;
    reg rst;
    reg tx_start;
    reg [7:0] tx_data;

    wire tx_pin;
    wire tx_busy;

    uart_tx uut (
        .clk(clk),
        .rst(rst),
        .tx_start(tx_start),
        .tx_data(tx_data),
        .tx_pin(tx_pin),
        .tx_busy(tx_busy)
    );

    // Clock
    initial begin
        clk = 0;
        forever #5 clk = ~clk;
    end

    initial begin

        rst = 1;
        tx_start = 0;
        tx_data = 8'h00;

        #20;
        rst = 0;

        // Send ASCII 'A'
        #20;
        tx_data = 8'h41;
        tx_start = 1;

        #10;
        tx_start = 0;

        #500000;

        $finish;
    end

    initial begin
        $dumpfile("uart_wave.vcd");
        $dumpvars(0, tb_uart);
    end

endmodule