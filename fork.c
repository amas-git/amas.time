#include<stdio.h>

int main(char ** argv) {
    int pid = fork();
    printf("fork()=%d\n", pid);
    if(pid) {
        printf("1> PID : %5d PARENT : %5d\n", getpid(), getppid());
    } else {
        printf("2> PID : %5d PARENT : %5d\n", getpid(), getppid());
    }
    sleep(200000);
    return 0;
}
